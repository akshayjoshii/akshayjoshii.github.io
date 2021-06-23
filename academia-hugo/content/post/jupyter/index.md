---
title: Display Jupyter Notebooks
subtitle: This page is reserved to publish Jupyter Notebooks in the future.
summary: This page is reserved to publish Jupyter Notebooks in the future.
authors:
- admin
tags: []
categories: []
date: "2019-02-05T00:00:00Z"
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal point options: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight
image:
  caption: 'Image credit: [**Unsplash**](https://unsplash.com/photos/CpkOjOcXdUY)'
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []

# Set captions for image gallery.
gallery_item:
- album: gallery
  caption: Default
  image: theme-default.png
- album: gallery
  caption: Ocean
  image: theme-ocean.png
- album: gallery
  caption: Forest
  image: theme-forest.png
- album: gallery
  caption: Dark
  image: theme-dark.png
- album: gallery
  caption: Apogee
  image: theme-apogee.png
- album: gallery
  caption: 1950s
  image: theme-1950s.png
- album: gallery
  caption: Coffee theme with Playfair font
  image: theme-coffee-playfair.png
- album: gallery
  caption: Strawberry
  image: theme-strawberry.png
---


```python
from IPython.core.display import Image
Image('https://www.python.org/static/community_logos/python-logo-master-v3-TM-flattened.png')
```

![png](./academia_0_0.png)

```python
print("Welcome to Akshay Joshi's Website!")
```

    Welcome to Akshay Joshi's Website!

## Install Python and Jupyter

[Install Anaconda](https://www.anaconda.com/distribution/#download-section) which includes Python 3 and Jupyter notebook.

Otherwise, for advanced users, install Jupyter notebook with `pip3 install jupyter`.

## Create a new blog post

Run the following commands in Terminal, substituting `<MY_WEBSITE_FOLDER>` and `my-post` with the file path to the website folder and a name for the blog post (without spaces), respectively:  

```bash
cd <MY_WEBSITE_FOLDER>
hugo new  --kind post post/my-post
cd <MY_WEBSITE_FOLDER>/content/post/my-post/
```

## Create or upload a Jupyter notebook

Run the following command to start Jupyter within the new blog post folder. Then create a new Jupyter notebook (*New > Python Notebook*) or upload a notebook.

```bash
jupyter notebook
```

## Convert notebook to Markdown

```bash
jupyter nbconvert Untitled.ipynb --to markdown --NbConvertApp.output_files_dir=.

# Copy the contents of Untitled.md and append it to index.md:
cat Untitled.md | tee -a index.md

# Remove the temporary file:
rm Untitled.md
```

## Edit the post metadata

Open `index.md` in the text editor and edit the title etc. in the front matter according to your preference.

To set a featured image, place an image named `featured` into the post's folder.

This page also supports Math & LaTeX code.
