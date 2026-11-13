from calculator import add, multiply, calculate_square

def run_app():
    val1 = add(10, 20)
    val2 = multiply(val1, 2)
    val3 = calculate_square(val2)
    print(f"Computed Result: {val3}")

if __name__ == "__main__":
    run_app()
