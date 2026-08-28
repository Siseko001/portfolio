---
title: "ML_Models — Linear Regression with Hyperparameter Tuning"
description: "A supervised machine learning project implementing and optimizing a Linear Regression model, from preprocessing through evaluation and GridSearchCV tuning."
techStack: ["Python", "NumPy", "pandas", "matplotlib", "seaborn", "scikit-learn"]
githubUrl: "https://github.com/Siseko001/ML_Models"
date: 2026-02-01
featured: false
---

## Overview

This project builds a Linear Regression model to predict a continuous target
variable from structured numerical features, then optimizes it using
hyperparameter tuning.

## What it does

- Preprocesses a structured dataset: handles missing values, applies feature
  scaling (StandardScaler / MinMaxScaler), and splits into train/test sets
- Trains a Linear Regression model on the processed data
- Evaluates performance using MAE, MSE, RMSE, and R² Score
- Tunes the model with **GridSearchCV**, testing multiple parameter
  combinations via cross-validation to select the best-performing version

## Tech stack

Python, NumPy, pandas, matplotlib/seaborn for visualization, and scikit-learn
for modeling and tuning.

## Key steps

1. Data preprocessing (missing values, feature scaling, train-test split)
2. Model training (Linear Regression)
3. Model evaluation (MAE, MSE, RMSE, R²)
4. Hyperparameter tuning with GridSearchCV

[View the notebook on GitHub →](https://github.com/Siseko001/ML_Models)