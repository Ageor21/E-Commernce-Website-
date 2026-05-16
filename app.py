import os
import logging

from flask import Flask, request, session, render_template, flash, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message

from extensions import db, mail
from models import User, Order, OrderDetails, CartItem, Product, Review


# Initialize Flask app
app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///ecommerce.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Email configuration
# Do NOT hard-code your Gmail password in code.
# Use environment variables instead.
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "fake_email")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "fake_email@gmail.com")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", app.config["MAIL_USERNAME"])

# Connect extensions to app
db.init_app(app)
mail.init_app(app)

# Configure logging
logging.basicConfig(filename="error.log", level=logging.ERROR)

# Create database tables
with app.app_context():
    db.create_all()


def calculate_cart_total(user_id):
    """
    Calculate the total price of items in the cart for a given user.
    """
    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    total = sum(item.quantity * item.product.price for item in cart_items)
    return total

def get_session_cart():
    """
    Returns the logged-out/session cart.
    Format:
    {
        "1": 2,
        "4": 1
    }
    """
    return session.get("cart", {})


def save_user_cart_to_session(user_id):
    """
    Copies the logged-in user's database cart into session cart.
    This lets the cart still show after logout.
    """
    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    session["cart"] = {
        str(item.product_id): item.quantity
        for item in cart_items
    }

    session.modified = True


def merge_session_cart_into_user_cart(user_id):
    """
    Merges logged-out/session cart into the user's database cart.
    This lets cart items survive login/logout transitions.
    """
    session_cart = get_session_cart()

    if not session_cart:
        return

    for product_id, quantity in session_cart.items():
        product_id = int(product_id)
        quantity = int(quantity)

        existing_item = CartItem.query.filter_by(
            user_id=user_id,
            product_id=product_id
        ).first()

        if existing_item:
            existing_item.quantity += quantity
        else:
            new_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(new_item)

    db.session.commit()

    session.pop("cart", None)
    session.modified = True

# Routes
@app.route("/")
def home():
    products = Product.query.all()
    return render_template("home.html", products=products)


@app.route("/search")
def search():
    query = request.args.get("query")

    if not query or len(query) < 3:
        flash("Search query must be at least 3 characters long.", "warning")
        return redirect(url_for("home"))

    products = Product.query.filter(Product.name.ilike(f"%{query}%")).all()
    return render_template("search_results.html", products=products, query=query)


@app.route("/cart/add/<int:product_id>", methods=["POST"])
def add_to_cart(product_id):
    quantity = int(request.form["quantity"])
    product = Product.query.get_or_404(product_id)

    if product.stock < quantity:
        flash(f"Only {product.stock} items of {product.name} are available.", "danger")
        return redirect(url_for("home"))

    if "user_id" in session:
        user_id = session["user_id"]

        cart_item = CartItem.query.filter_by(
            user_id=user_id,
            product_id=product_id
        ).first()

        if cart_item:
            cart_item.quantity += quantity
        else:
            cart_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(cart_item)

        db.session.commit()
        flash(f"{product.name} added to your cart!", "success")

    else:
        cart = session.get("cart", {})

        if str(product_id) in cart:
            cart[str(product_id)] += quantity
        else:
            cart[str(product_id)] = quantity

        session["cart"] = cart
        flash(f"{product.name} added to your cart temporary storage!", "info")

    return redirect(url_for("home"))


@app.route('/cart')
def cart():
    if 'user_id' in session:
        user_id = session['user_id']
        cart_items = CartItem.query.filter_by(user_id=user_id).all()

        total_price = sum(item.product.price * item.quantity for item in cart_items)

        return render_template(
            'cart.html',
            cart_items=cart_items,
            total_price=total_price
        )

    cart = session.get('cart', {})
    product_ids = [int(pid) for pid in cart.keys()]

    products = Product.query.filter(Product.id.in_(product_ids)).all() if product_ids else []

    total_price = sum(
        product.price * cart[str(product.id)]
        for product in products
    )

    return render_template(
        'cart.html',
        products=products,
        cart=cart,
        total_price=total_price
    )


@app.route("/cart/remove/<int:product_id>", methods=["POST"])
def remove_from_cart(product_id):
    if "user_id" in session:
        user_id = session["user_id"]

        cart_item = CartItem.query.filter_by(
            user_id=user_id,
            product_id=product_id
        ).first()

        if cart_item:
            db.session.delete(cart_item)
            db.session.commit()
            flash("Item removed from cart.", "success")
        else:
            flash("Item not found in cart.", "danger")

    else:
        cart = session.get("cart", {})

        if str(product_id) in cart:
            cart.pop(str(product_id))
            session["cart"] = cart
            flash("Item removed from cart.", "success")
        else:
            flash("Item not found in cart.", "danger")

    return redirect(url_for("cart"))


@app.route('/place_order', methods=['POST'])
def place_order():
    user_id = session.get('user_id')

    if not user_id:
        flash("You need to log in to place an order.", "danger")
        return redirect(url_for('login'))

    user = User.query.get(user_id)

    if not user:
        flash("User not found. Please log in again.", "danger")
        return redirect(url_for('login'))

    cart_items = CartItem.query.filter_by(user_id=user_id).all()

    if not cart_items:
        flash("Your cart is empty. Add items to your cart before placing an order.", "warning")
        return redirect(url_for('cart'))

    total_price = sum(item.quantity * item.product.price for item in cart_items)

    order = Order(
        user_id=user_id,
        total_price=total_price
    )

    db.session.add(order)
    db.session.commit()

    # Clear the cart after the order is created
    CartItem.query.filter_by(user_id=user_id).delete()
    db.session.commit()

    email_sent = send_email(
        "Order Confirmation",
        [user.email],
        f"Hi {user.name},\n\n"
        f"Your order has been placed successfully. Order ID: {order.id}.\n\n"
        f"Thank you for shopping with us!\n"
        f"The ShopEase Team"
    )

    if email_sent:
        flash("Order placed successfully! A confirmation email has been sent.", "success")
    else:
        flash("Order placed successfully! Confirmation email could not be sent right now.", "warning")

    return redirect(url_for('order_confirmation', order_id=order.id))


@app.route("/order_confirmation/<int:order_id>")
def order_confirmation(order_id):
    order = Order.query.get_or_404(order_id)
    return render_template("order_confirmation.html", order=order)


@app.route("/order/<int:order_id>/update_status", methods=["POST"])
def update_order_status(order_id):
    new_status = request.form.get("status")

    order = Order.query.get_or_404(order_id)
    order.status = new_status

    db.session.commit()

    flash(f"Order {order_id} status updated to {new_status}.", "success")
    return redirect(url_for("admin_dashboard"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")

        if not name or not email or not password:
            flash("All fields are required.", "warning")
            return redirect(url_for("register"))

        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "warning")
            return redirect(url_for("register"))

        if User.query.filter_by(email=email).first():
            flash("Email is already registered.", "danger")
            return redirect(url_for("register"))

        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

        new_user = User(
            name=name,
            email=email,
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin

            # Merge any logged-out cart items into this user's database cart
            merge_session_cart_into_user_cart(user.id)

            flash(f"Welcome back, {user.name}! Your cart has been restored.", "success")
            return redirect(url_for('home'))

        flash("Invalid email or password. Please try again.", "danger")
        return redirect(url_for('login'))

    return render_template('login.html')


@app.route('/logout')
def logout():
    user_id = session.get('user_id')

    if user_id:
        # Copy database cart into session cart before logging out
        save_user_cart_to_session(user_id)

    session.pop('user_id', None)
    session.pop('is_admin', None)

    flash("You have been logged out successfully. Your cart was saved.", "info")
    return redirect(url_for('home'))


@app.route("/profile", methods=["GET", "POST"])
def profile():
    if "user_id" not in session:
        flash("You need to log in to view your profile.", "danger")
        return redirect(url_for("login"))

    user = User.query.get_or_404(session["user_id"])

    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")

        if name:
            user.name = name

        if email:
            user.email = email

        if password and len(password) >= 6:
            user.password = generate_password_hash(password, method="pbkdf2:sha256")

        db.session.commit()

        flash("Profile updated successfully!", "success")
        return redirect(url_for("profile"))

    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()

    return render_template("profile.html", user=user, orders=orders)


@app.route("/product/<int:product_id>", methods=["GET", "POST"])
def product_view(product_id):
    product = Product.query.get_or_404(product_id)

    if request.method == "POST":
        if "user_id" not in session:
            flash("You need to log in to submit a review.", "danger")
            return redirect(url_for("login"))

        content = request.form["content"]
        rating = int(request.form["rating"])

        if not content or rating not in range(1, 6):
            flash("Please provide a valid review and rating 1-5 stars.", "warning")
            return redirect(url_for("product_view", product_id=product_id))

        review = Review(
            product_id=product_id,
            user_id=session["user_id"],
            content=content,
            rating=rating
        )

        db.session.add(review)
        db.session.commit()

        flash("Your review has been submitted.", "success")
        return redirect(url_for("product_view", product_id=product_id))

    sort_by = request.args.get("sort", "most_recent")

    if sort_by == "highest_rated":
        reviews = Review.query.filter_by(product_id=product_id).order_by(Review.rating.desc()).all()
    else:
        reviews = Review.query.filter_by(product_id=product_id).order_by(Review.created_at.desc()).all()

    total_reviews = len(reviews)
    avg_rating = sum([r.rating for r in reviews]) / total_reviews if total_reviews > 0 else 0

    return render_template(
        "product_view.html",
        product=product,
        reviews=reviews,
        avg_rating=avg_rating,
        total_reviews=total_reviews
    )


@app.route("/product/<int:product_id>/review/<int:review_id>/edit", methods=["GET", "POST"])
def edit_review(product_id, review_id):
    if "user_id" not in session:
        flash("You need to log in to edit your review.", "danger")
        return redirect(url_for("login"))

    review = Review.query.get_or_404(review_id)

    if review.user_id != session["user_id"]:
        flash("You are not authorized to edit this review.", "danger")
        return redirect(url_for("product_view", product_id=product_id))

    if request.method == "POST":
        review.content = request.form["content"]
        review.rating = int(request.form["rating"])

        db.session.commit()

        flash("Your review has been updated.", "success")
        return redirect(url_for("product_view", product_id=product_id))

    return render_template("edit_review.html", review=review, product_id=product_id)


@app.route("/product/<int:product_id>/review/<int:review_id>/delete", methods=["POST"])
def delete_review(product_id, review_id):
    if "user_id" not in session:
        flash("You need to log in to delete your review.", "danger")
        return redirect(url_for("login"))

    review = Review.query.get_or_404(review_id)

    if review.user_id != session["user_id"]:
        flash("You are not authorized to delete this review.", "danger")
        return redirect(url_for("product_view", product_id=product_id))

    db.session.delete(review)
    db.session.commit()

    flash("Your review has been deleted.", "success")
    return redirect(url_for("product_view", product_id=product_id))


@app.route("/admin")
def admin_dashboard():
    if "user_id" not in session or not session.get("is_admin"):
        flash("You are not authorized to access the admin panel.", "danger")
        return redirect(url_for("login"))

    users = User.query.all()
    orders = Order.query.all()
    products = Product.query.all()

    return render_template(
        "admin_orders.html",
        users=users,
        orders=orders,
        products=products
    )


@app.route("/admin/add_product", methods=["GET", "POST"])
def add_product():
    if "user_id" not in session or not session.get("is_admin"):
        flash("You are not authorized to access the admin panel.", "danger")
        return redirect(url_for("login"))

    if request.method == "POST":
        name = request.form["name"]
        description = request.form.get("description", "")
        price = float(request.form["price"])
        stock = int(request.form["stock"])
        image_url = request.form.get("image_url", "")

        product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            image_url=image_url
        )

        db.session.add(product)
        db.session.commit()

        flash("Product added successfully.", "success")
        return redirect(url_for("admin_dashboard"))

    return render_template("add_product.html")


@app.route("/admin/edit_product/<int:product_id>", methods=["GET", "POST"])
def edit_product(product_id):
    if "user_id" not in session or not session.get("is_admin"):
        flash("You are not authorized to access the admin panel.", "danger")
        return redirect(url_for("login"))

    product = Product.query.get_or_404(product_id)

    if request.method == "POST":
        product.name = request.form["name"]
        product.description = request.form.get("description", product.description)
        product.price = float(request.form["price"])
        product.stock = int(request.form["stock"])
        product.image_url = request.form.get("image_url", product.image_url)

        db.session.commit()

        flash("Product updated successfully.", "success")
        return redirect(url_for("admin_dashboard"))

    return render_template("edit_product.html", product=product)


@app.route("/admin/delete_product/<int:product_id>", methods=["POST"])
def delete_product(product_id):
    if "user_id" not in session or not session.get("is_admin"):
        flash("You are not authorized to access the admin panel.", "danger")
        return redirect(url_for("login"))

    product = Product.query.get_or_404(product_id)

    db.session.delete(product)
    db.session.commit()

    flash("Product deleted successfully.", "success")
    return redirect(url_for("admin_dashboard"))


@app.errorhandler(404)
def not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_server_error(error):
    logging.error(f"Internal server error: {error}")
    flash("An unexpected error occurred. Please try again later.", "danger")
    return redirect(url_for("home"))


def send_email(subject, recipients, body):
    sender = app.config.get("MAIL_DEFAULT_SENDER") or app.config.get("MAIL_USERNAME")

    if not sender:
        logging.error("Email was not sent because no MAIL_DEFAULT_SENDER or MAIL_USERNAME is configured.")
        return False

    try:
        msg = Message(
            subject=subject,
            recipients=recipients,
            body=body,
            sender=sender
        )

        mail.send(msg)
        return True

    except Exception as error:
        logging.error(f"Email failed to send: {error}")
        return False


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)