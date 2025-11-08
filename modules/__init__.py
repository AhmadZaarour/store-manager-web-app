from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from .config import Config

db = SQLAlchemy()
migrate = Migrate()  # <--- Add this

def create_app():
    app = Flask(__name__, static_folder='../dashboard', static_url_path='')
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)  # <--- Link Migrate with the app and db

    from . import tables
    from .routes import main
    app.register_blueprint(main)

    return app
