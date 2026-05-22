import unittest

from model import LABELS


class ModelServiceTests(unittest.TestCase):
    def test_labels_match_training_class_order_with_display_names(self) -> None:
        self.assertEqual(
            LABELS,
            ["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"],
        )


if __name__ == "__main__":
    unittest.main()
