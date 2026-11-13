"""
Calculator utility library for developer automation analysis
"""

def add(a: float, b: float) -> float:
    """Returns sum of a and b"""
    return a + b

def subtract(a: float, b: float) -> float:
    """Returns difference of a and b"""
    return a - b

def multiply(a: float, b: float) -> float:
    """Returns product of a and b"""
    return a * b

def divide(a: float, b: float) -> float:
    """Returns quotient of a and b"""
    if b == 0:
        raise ValueError("Cannot divide by zero.")
    return a / b

def calculate_square(x: float) -> float:
    """Returns square of x"""
    return x * x
