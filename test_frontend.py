import unittest
from types import SimpleNamespace
from unittest.mock import patch
import server


class FrontendTests(unittest.TestCase):
    def test_exact_filters(self):
        rows = server.catalog(60000, "laptop")
        self.assertTrue(rows)
        self.assertTrue(all(p["price_inr"] <= 60000 and p["stock"] > 0 and p["category"] == "laptop" for p in rows))

    def test_no_results_skips_ai(self):
        with patch.object(server, "generate") as generate:
            result = server.ask({"question": "Laptop", "budget": 0})
            self.assertEqual(result["products"], [])
            generate.assert_not_called()

    def test_retrieval_and_followup(self):
        eligible = server.catalog(60000, "laptop")
        product_id = eligible[0]["product_id"]
        with patch.object(server, "get_search") as search, patch.object(server, "generate", side_effect=["portable laptop", "An evidence-based answer"]):
            search.return_value.similarity_search.return_value = [SimpleNamespace(metadata={"product_id": product_id})]
            result = server.ask({"question": "Which is portable?", "budget": 60000, "category": "laptop", "history": [{"role":"user","content":"Laptop for college"}, {"role":"assistant","content":"Here are options"}]})
            self.assertEqual(result["answer"], "An evidence-based answer")
            self.assertEqual(result["products"][0]["product_id"], product_id)
            query = search.return_value.similarity_search.call_args
            self.assertEqual(query.args[0], "portable laptop")
            self.assertEqual(set(query.kwargs["filter"]["product_id"]["$in"]), {p["product_id"] for p in eligible})

    def test_invalid_budget(self):
        with self.assertRaises(ValueError):
            server.ask({"question":"Laptop", "budget":float("nan")})


if __name__ == "__main__":
    unittest.main()
