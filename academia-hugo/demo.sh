#!/usr/bin/env bash

cd exampleSite
hugo --themesDir ../../ --i18n-warnings --gc --minify --enableGitInfo --baseURL $URL
