---
title: Robust Spoken Language Recognition
summary: Uncover hidden patterns in the phoneme vector space by performing Pairwise Cosine Similarity, Dimensionality Reduction & Spacial Clustering.
tags:
- Machine and Deep Learning
- Natural Language Processing
date: "2020-08-28T00:00:00Z"

# Optional external URL for project (replaces project detail page).
external_link: ""

image:
  caption: 'Image credit: [**Medium**](https://medium.com/hackernoon/understanding-speech-recognition-to-design-better-voice-interfaces-bef36b8614f)'
  focal_point: Smart

links:
# - icon: twitter
#   icon_pack: fab
#   name: Follow
#   url: https://twitter.com/georgecushen
url_code: "https://github.com/akshayjoshii/Speech-Recognition"
url_pdf: "https://github.com/akshayjoshii/Speech-Recognition/blob/master/Final%20Report/Spoken%20Language%20Recognition%20Report.pdf"
url_slides: ""
url_video: ""

# Slides (optional).
#   Associate this project with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides = "example-slides"` references `content/slides/example-slides.md`.
#   Otherwise, set `slides = ""`.
slides: 
---

**Please open the PDF and Code links mentioned above to find detailed project report and source code!**

<br>

## Abstract:
Accurate Grapheme-to-Phoneme conversion is crucial for the effectiveness and success of Automatic Speech Recognition and Text-to-Speech systems. This task may perhaps be particularly challenging when building multilingual ASR agents which requires un-ambiguous (without being affected by different accents/acoustic domains/similar sounding words in analogous languages ex: Kannada & Sanskrit) conversion of textual words to phonemes.

A typical G2P process has 3 steps:
  * Aligning Grapheme token to Phoneme token
  * Learning the G to P conversion (neural/statistical methods)
  * Triaging the best possible pronunciation provided the model

In this machine learning project, the task is to import and efficiently parse the dataset which contains 50 phonemes (perhaps retrieved from a CNN/Transformer based neural model for grapheme-to-phoneme conversion) & their corresponding representations in the embedding space as a 236-dimensional vector. Further, to assess if these phonemes are similar or correlated to each other in terms of usage/semantics/audio signature, we perform an array of tasks ranging from calculating the Pairwise Cosine Similarities, Dimensionality Reduction using Linear & Manifold Learning methods and Clustering to uncover hidden patterns in the phoneme vector space.

<br>

## Tasks:

1. Conduct a small research on phoneme embeddings (VSM).
2. Read the dataset into a suitable data structure (e.g., Pandas data frame, Python dictionary, Numpy array, etc.)
3. Computing the pair-wise cosine similarity between the phonemes represented by the embeddings and obtaining a confusion matrix of similarity scores. 
4. Exploring the embeddings space with at different techniques. Perhaps, using dimensionality reduction and visualization (e.g., PCA, t-SNE), as well as a different clustering  analysis methods.

<br>

## Implemented Functions:

1. Pairwise Cosine Similarity Heatmap/Confusion Matrix
2. Agglomerative Clustering & Dendrogram Visualization
3. Priniciple Component Analysis (PCA)
4. Independent Component Analysis (ICA)
5. t-Distributed Stochastic Neighbor Embedding (t-SNE)
6. Multidimensional Scaling (MDS - Metric)
7. PCA - DBSCAN Clustering

## Conclusion
A state-of-the-art deep neural network for ASR/Grapheme-to-Phoneme conversion must efficiently grasp the semantics, syntax & usage of words in relatively analogous languages and multiple speech accents of the same language in all acoustic conditions to discriminate and classify similar sounding phonemes into corresponding clusters/reduce the pairwise distance in the vector space. Also, there appears to be moderate amounts of similarity among phoneme vector pairs in the right bottom corner of the heat map. Finally, it is onerous to comment further on the effectiveness of similarity/dissimilarity of phonemes in the provided task without the additional context of the problem and the type of neural model used or the languages processed for G2P conversion.