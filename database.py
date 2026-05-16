from app import app
from extensions import db
from models import Product


with app.app_context():
    existing_products = Product.query.count()

    if existing_products > 0:
        print("Products already exist. No new products were added.")
    else:
        products = [
            Product(
                name="Laptop",
                description="High-performance laptop",
                price=999.99,
                stock=10,
                image_url=""
            ),
            Product(
                name="Smartphone",
                description="Latest model smartphone",
                price=799.99,
                stock=20,
                image_url=""
            ),
            Product(
                name="Headphones",
                description="Noise-cancelling headphones",
                price=199.99,
                stock=15,
                image_url=""
            ),
            Product(
                name="Gaming PC",
                description="High Specs",
                price=1999.99,
                stock=5,
                image_url=""
            ),
        ]

        db.session.add_all(products)
        db.session.commit()

        print("Database populated successfully!")