import unittest
from calculator import add, subtract, multiply, divide, calculate_square

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(2, 3), 5)

    def test_subtract(self):
        self.assertEqual(subtract(10, 4), 6)

    def test_multiply(self):
        self.assertEqual(multiply(3, 7), 21)

    def test_divide(self):
        self.assertEqual(divide(20, 4), 5)

    def test_divide_zero(self):
        with self.assertRaises(ValueError):
            divide(10, 0)

    def test_square(self):
        self.assertEqual(calculate_square(6), 36)

if __name__ == "__main__":
    unittest.main()
