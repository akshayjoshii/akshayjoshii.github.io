---
title: COVID-19 Tweets Sentiment & Exploratory Data Analysis
summary: Deep Self-supervised Transfer Learning based Sentiment Analysis of COVID19 Tweets
tags:
- Natural Language Processing
- Machine and Deep Learning
date: "2020-09-01T00:00:00Z"

# Optional external URL for project (replaces project detail page).
external_link: 

image:
  caption: 'Image credit: [**MZ Web**](https://www.mz-web.de/image/36334534/2x1/940/470/5c88f8dfe6f930ff2a8d4352e9313d17/or/b-coronavirus.jpg)'
  focal_point: Smart

links:
# - icon: twitter
#   icon_pack: fab
#   name: Follow
#   url: https://twitter.com/georgecushen
url_code: "https://github.com/akshayjoshii/COVID19-Tweet-Sentiment-Analysis-and-EDA"
url_pdf: ""
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: 
---

**The project is currently in progress, code & report are not complete yet**

## Abstract:
The [**COVID-19 Tweets**](https://www.kaggle.com/gpreda/covid19-tweets) dataset hosted on Kaggle has **92,276** unique tweets related to the COVID-19 pandemic. Each tweet containes the high-frequency hashtag (#covid19) and are scrapped using Twitter API. The dataset **does not** contain sentiment labels corresponding to each tweet. Thus, supervised learning (ML/DL) methods cannot be used directly for training on the dataset.

The following tasks are implemented in this project:
1. Perform Exploratory Data Analysis
    * Pre-processing the tweets to perform Normalization, Stop Word Removal, Stemming & Lammetization
    * Plot a wordcloud of most frequent words used in tweets (location-wise).
    * Plot geographical distribution of tweets.
    * Plot frequency of tweets/user and so on.

<br>

2. Unsupervised Sentiment Analysis using Density-based Spatial Clustering methods. [In Progress]
    * Projecting the tweets into vector space using pre-trained Word2Vec model.
    * Apply Linear & Manifold Dimentionality Reduction techniques to reduce the predictors from 13 to perhaps 2.
    * Perform DBSCAN clustering to cluster the un-labelled tweets into 4 categories: happy, sad, angry, neutral

<br>

3. Explore Transfer Learning with XGBoost (Machine Learning) [In Progress]
    * Train gradient boosted decision trees on a similar but [**labelled**](https://www.kaggle.com/surajkum1198/twitterdata) dataset.
    * Use the trained model for inference on our task's dataset.

<br>

4. Explore Transfer Learning with Self-Attention Networks (Deep Learning) [In Progress]
    * Build dataloader to process & consume the dataset into train/test/validation.
    * Train self-attention based transformer network using PyTorch.
    * Use the trained model for inference on our task's dataset.

<br>

## Instruction:
1. Clone the repository.
2. Install Python & PIP.
3. Install project dependencies: "pip install -r requirements.txt"
4. Perform Exploratory Data Analysis: "python analysis.py"