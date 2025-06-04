import pandas as pd
import numpy as np

np.random.seed(42)
n = 200

# X is a random walk
X = np.cumsum(np.random.normal(0, 1, n))

# Y is directly dependent on X (e.g., Y_t = 2*X_t-1 + noise)
Y = np.roll(X, 1) * 2 + np.random.normal(0, 0.5, n)
Y[0] = 0  # Handle first index due to shift

# Z is pure noise
Z = np.random.normal(0, 1, n)

df = pd.DataFrame({
    'X': X,
    'Y': Y,
    'Z': Z
})

df.to_csv("causal_test_biased.csv", index=False)
