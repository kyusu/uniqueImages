uniqueImages
============

[![dependencies Status](https://david-dm.org/kyusu/uniqueImages/status.svg)](https://david-dm.org/kyusu/uniqueImages)
[![Maintainability](https://api.codeclimate.com/v1/badges/a136817bd50bf9e58a57/maintainability)](https://codeclimate.com/github/kyusu/uniqueImages/maintainability)
[![Known Vulnerabilities](https://snyk.io/test/github/kyusu/uniqueImages/badge.svg?targetFile=package.json)](https://snyk.io/test/github/kyusu/uniqueImages?targetFile=package.json)
[![DeepScan grade](https://deepscan.io/api/teams/10488/projects/13338/branches/220804/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=10488&pid=13338&bid=220804)


A node command line tool which can be used to find duplicate images in a directory even if the images differ in
resolution, contrast, brightness or color. It currently fails at cropped and mirrored images and works only with JPGs.

In the first step the md5 hash of all images in the given directory is calculated to remove obvious duplicates. Images
with identical hashes are grouped and the result is printed out to the console.

In the second step it calculates the perceptual image hash of all images with unique md5 hashes based on an algorithm
described in "Bian Yang; Fan Gu; XiaMu Niu, "Block Mean Value Based Image Perceptual Hashing," Intelligent Information
Hiding and Multimedia Signal Processing, 2006. IIH-MSP '06. International Conference on , vol., no., pp.167,172, Dec.
2006".

Images with similar hashes are grouped again using the hamming distance and the result is also printed out to the
console.

Usage:
-----

```
  $ node findDuplicatesCmd.js ~/Pictures/Mongolia\ 2012
```

License
-------

Distributed under an MIT license, please see LICENSE in the top dir.
