---
title: "Art Style Classification with Self-Trained Ensemble of AutoEncoding Transformations"
authors:
- admin
date: "2020-09-01T00:00:00Z"
doi: ""

# Schedule page publish date (NOT publication's date).
publishDate: "2020-09-01T00:00:00Z"

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ["3"]

# Publication name and optional abbreviated publication name.
publication: "arXiv"
publication_short: ""

abstract: The artistic style of a painting is a rich descriptor that reveals both visual and deep intrinsic knowledge about how an artist uniquely portrays and expresses their creative vision. Accurate categorization of paintings across different artistic movements and styles is critical for large-scale indexing of art databases. However, the automatic extraction and recognition of these highly dense artistic features has received little to no attention in the field of computer vision research. In this paper, we investigate the use of deep self-supervised learning methods to solve the problem of recognizing complex artistic styles with high intra-class and low inter-class variation. Further, we outperform existing approaches by almost 20% on a highly class imbalanced WikiArt dataset with 27 art categories. To achieve this, we train the EnAET semi-supervised learning model (Wang et al., 2019) with limited annotated data samples and supplement it with self-supervised representations learned from an ensemble of spatial and non-spatial transformations.

# Summary. An optional shortened abstract.
summary: Investigation on the use of deep semi-supervised neural models to extract dense features in complex & ambiguous images spanning across 27 unique artistic styles. Self-supervision enforced to resolve class imbalance of WikiArt dataset.

tags:
featured: true

links:
# - name: Custom Link
url: "https://arxiv.org/abs/2012.03377"
url_pdf: "https://arxiv.org/pdf/2012.03377"
url_code: "https://github.com/akshayjoshii/Deep_Self-Supervised_Art_Style_Recognition"
url_dataset: "https://archive.org/details/wikiart-dataset"
# url_poster: '#'
# url_project: ''
# url_slides: ''
# url_source: '#'
# url_video: '#'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: 'Image credit: [**UOC**](http://biblioteca.uoc.edu/en/resources/resource/wikiart)'
  focal_point: ""
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects:
# - internal-project

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
# slides: example
---

{{% alert note %}}
Click the *Slides* button above to demo academia's Markdown slides feature.
{{% /alert %}}
