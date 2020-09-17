---
title: Multi-stage Informational Retrieval & Ranking System
summary: Search Engine implemented using Language Models, BM25 (Okapi, Plus) & TF-IDF.
tags:
- Natural Language Processing
- Information Retrieval and Data Mining
- Machine and Deep Learning
date: "2020-08-27T00:00:00Z"

# Optional external URL for project (replaces project detail page).
external_link: 

image:
  caption: 'Image credit: [**Pond5**](https://images.pond5.com/information-retrieval-animated-word-cloud-footage-074108980_prevstill.jpeg)'
  focal_point: Smart

links:
# - icon: twitter
#   icon_pack: fab
#   name: Follow
#   url: https://twitter.com/georgecushen
url_code: "https://github.com/akshayjoshii/Statistical-NLP-Information-Retrieval-Project"
url_pdf: "https://github.com/akshayjoshii/Statistical-NLP-Information-Retrieval-Project/blob/master/SNLP%20Project%20Report.pdf"
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: 
---

**Please click on the 'Pdf' and 'Code' buttons displayed above to view project report and source code!**

## Abstract:
From recent times, Natural Language Processing Systems have been enjoying wide popularity in various domains such as in the development of high precision Search Engines, Text Entity Recognition, Content Recommenders, Speech Recognition Systems and so on. The prominent usage is in the fields of Information Retrieval and Data Mining through the usage of sophisticated Language Models. In this project the scope is only limited to statistical and classical methods rather than deployment large-scale deep learning solutions. In this project, we deploy an array of both simple and advanced Information Retrieval systems which deals with efficient and robust organization, storage, retrieval & evaluation of information from text corpus/document evidences. IR systems are very widely used in everyday lives in the forms of search engines, files explorers, document searching tools etc. Thus, development of such high impact systems is desired. However, there are a multitude of challenges while exploring the vastness of natural language text and it’s usage in the corpus scraped from the web.

The goal of a good IR system is to achieve high precision for a user query. But, at the same time, the system has to balance the trade-off to achieve respectable recall too. The system demonstrates high precision if the documents retrieved answers the user query completely i.e. all the relevant documents are ranked higher than the rest in the corpus. Whereas, recall is the fraction of the relevant documents that are successfully retrieved.

In this project, the task is to develop and evaluate a two-stage information retrieval model that given a query returns the most relevant documents and then ranks the sentences within the documents. For the first part, we should implement a baseline document retriever with tf-idf features. In the second part we should improve over the baseline of the document retriever with an advanced approach such as **n-gram Language Models**, **Okapi BM25/BM25 Plus** along with word vectors from pre-trained **Word2Vec** model. The third part extends the model to return the top 50 ranked sentences from the documents retrieved by the later advanced model. The answer to the query should be found in one of the top-ranked sentences.

## Features Implemented:
1. TF-IDF Model with Bi-gram features
2. BM25 (Okapi and Plus) Model with Bi-gram features
3. BM25 based Sentence Re-ranker
4. Query processing time reduced to **~8 mins** from **20 mins** using Parallel processing, Caching & Efficient Data Structures

## Instructions:
1. Install dependencies: "pip install -r requirements.txt"
2. Run Extract.py to parse xml file to retrieve documents and query and then generate preprocessed documents. (**Execution time: 3-4 mins**)
3. Run TF-IDF.py to get the **Precision @ K** results of all three tasks i.e. TF-IDF (Baseline), BM25 Plus and **Mean Reciprocal Rank (MRR)** for sentences. (**Execution time: 6-8 mins**)