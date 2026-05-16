# Replace your existing /profile route in app.py with this version.
# It keeps your current User model and adds safer profile updates + dashboard stats.

@app.route('/profile', methods=['GET', 'POST'])
def profile():
    if 'user_id' not in session:
        flash("You need to log in to view your profile.", "danger")
        return redirect(url_for('login'))

    user = User.query.get_or_404(session['user_id'])

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        current_password = request.form.get('current_password', '')
        new_password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        changed = False

        if not name:
            flash("Name is required.", "warning")
            return redirect(url_for('profile'))

        if not email:
            flash("Email is required.", "warning")
            return redirect(url_for('profile'))

        if name != user.name:
            user.name = name
            changed = True

        email_is_changing = email != user.email
        password_is_changing = bool(new_password)

        if email_is_changing or password_is_changing:
            if not current_password or not check_password_hash(user.password, current_password):
                flash("Please enter your current password to change your email or password.", "danger")
                return redirect(url_for('profile'))

        if email_is_changing:
            existing_user = User.query.filter(User.email == email, User.id != user.id).first()

            if existing_user:
                flash("That email is already being used by another account.", "danger")
                return redirect(url_for('profile'))

            user.email = email
            changed = True

        if password_is_changing:
            if len(new_password) < 6:
                flash("New password must be at least 6 characters long.", "warning")
                return redirect(url_for('profile'))

            if new_password != confirm_password:
                flash("New password and confirmation password do not match.", "danger")
                return redirect(url_for('profile'))

            # pbkdf2 avoids the hashlib.scrypt error on your current Python/OpenSSL setup.
            user.password = generate_password_hash(new_password, method="pbkdf2:sha256")
            changed = True

        if changed:
            db.session.commit()
            flash("Profile updated successfully.", "success")
        else:
            flash("No profile changes were made.", "info")

        return redirect(url_for('profile'))

    orders = Order.query.filter_by(user_id=user.id).order_by(Order.created_at.desc()).all()

    profile_stats = {
        "total_orders": len(orders),
        "total_spent": sum(order.total_price for order in orders),
        "pending_orders": sum(1 for order in orders if order.status in ["Pending", "Processing"]),
        "latest_order": orders[0] if orders else None,
    }

    return render_template(
        'profile.html',
        user=user,
        orders=orders,
        profile_stats=profile_stats
    )
