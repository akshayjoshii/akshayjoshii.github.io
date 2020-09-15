#!/usr/bin/env bash

cd academia-hugo/exampleSite
hugo --themesDir ../../ --i18n-warnings -gc --minify --enableGitInfo --baseURL $URL
