import os
from sqlalchemy import create_engine, inspect, text
from backend.src.config import Config

DB_URI = os.environ.get('DATABASE_URL') or Config.SQLALCHEMY_DATABASE_URI

def main():
    engine = create_engine(DB_URI)
    with engine.connect() as conn:
        inspector = inspect(conn)
        if 'security_events' not in inspector.get_table_names():
            print("Table 'security_events' does not exist. Nothing to do.")
            return
        columns = [col['name'] for col in inspector.get_columns('security_events')]
        if 'event_metadata' in columns:
            print("Column 'event_metadata' already exists. No action needed.")
            return
        if 'metadata' in columns:
            conn.execute(text('ALTER TABLE security_events RENAME COLUMN metadata TO event_metadata'))
            print("Renamed column 'metadata' to 'event_metadata'.")
            return
        print("Column 'metadata' not found. No changes made.")

if __name__ == '__main__':
    main()
