---
title: Graph Convolution Network Classifier with Sparse Adjacency Matrix Prior
summary: Benchmarking FCN, CNN & GCN Classfier with a Custom Prior
tags:
- Machine and Deep Learning
- Computer Vision
date: "2021-03-15T00:00:00Z"

# Optional external URL for project (replaces project detail page).
external_link: ""

image:
  caption: 'Image credit: [**Medium**](https://miro.medium.com/max/1440/1*Ru3CizrB14hvpZQ7ZtgIag.png)'
  focal_point: Smart

links:
# - icon: twitter
#   icon_pack: fab
#   name: Follow
#   url: https://twitter.com/georgecushen
url_code: "https://github.com/akshayjoshii/graph_neural_network"
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

**Please click on the 'Code' button displayed above to view project source code in GitHub.**

## Abstract

Benchmarking performances of Fully Connected Network (FCN), Deep Convolutional Neural Network (CNN) & Graph Convolution Network with 3 different priors on MNIST.

## Available Models

    1. Fully Connected
    2. Graph (with my Custom Adj Matrix - default)
    3. Convolution
    4. Graph (with Gaussian Adj Matrix)
    5. Graph (with Trainable Adj Matrix)

## Implementation of a Graph Neural Network Classifier with 3 different priors

    1. Sparse Adjacency Matrix (Feng et al., 2020)
    2. Gaussian Adjacency Matrix & Normalization as per (Kipf & Welling et al., ICLR 2017)
    3. Trainable Adjacency Matrix (Predict Edges)

## Requirements

    1. Python 3
    2. PyTorch
    3. Numpy
    4. Networkx
    5. Scipy

## Usage

    1. python graph_neural_network.py --model fc
    2. python graph_neural_network.py --model conv
    3. python graph_neural_network.py --model gaussian_graph
    4. python graph_neural_network.py --model graph --pred_edge
    5. python graph_neural_network.py --model graph
