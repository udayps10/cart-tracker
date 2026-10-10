import pandas
import sqlite3


products = pandas.read_csv("products.csv")

database = sqlite3.connect("products.db")

products.to_sql(
    "products",
    database,
    if_exists="replace",
    index=False
)

database.close()

print("Database created!")
print("Products added:", len(products))