---
title: Open-domain Question Answering with End-to-End Memory Networks
summary: Deep Neural implementation of a QA System using Knowledge Graphs & Wikipedia Corpus.
tags:
- Machine and Deep Learning
- Natural Language Processing
- Information Retrieval and Data Mining
date: "2020-08-05T00:00:00Z"

# Optional external URL for project (replaces project detail page).
external_link: ""

image:
  caption: 'Image credit: [**Medium**](https://miro.medium.com/max/8978/1*ncFVduh3IP2IA-sfT4Rcpw.jpeg)'
  focal_point: Smart

links:
# - icon: twitter
#   icon_pack: fab
#   name: Follow
#   url: https://twitter.com/georgecushen
url_code: "https://github.com/akshayjoshii/Open_Domain_Question_Answering"
url_pdf: ""
url_slides: ""
url_video: "https://youtu.be/9A34wTzw5Fw"

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: 
---

**Please open the Video and Code links mentioned above to find detailed Model Performance and Source code!**

## Abstract
The task is to build a statistical or deep neural model for Question Answering either utilizing both the provided Wikidata Knowledge Graph and Wikipedia Text Corpus or just a single knowledge source. Any existing methods/libraries could be utilized. In this project, I have implemented an End-to-End Memory Net using Keras. Later, trained the model for 100 epochs on Facebook's bAbI dataset which has 1000 questions for training and 1000 for test. Also, the dataset has an array of text passages ranging from Single-fact, Multi-fact, Multihop Reasoning to Agent Decision based corpus.


## Execution Instructions
* Clone the repository
* Install the project dependencies: "pip install -r requirements.txt"
* In the "qa_model.py" file set the hyperparameters (lstm_size, epochs, batch size, model type) accordingly.
* Run the model: "python qa_model.py"
* Assess model performance using the test questions in [Test Questions](https://github.com/akshayjoshii/Open_Domain_Question_Answering/blob/master/KB%2BWiki/toy-task-qa-kg-text-test.txt) file

## Available Models
1. LSTM
2. Bi-Directional LSTM
3. GRU
4. End-to-End Memory Net

