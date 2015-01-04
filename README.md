uniqueImages
============

A node command line tool which can be used to find duplicate images in a directory even if the images differ in
resolution, contrast, brightness or color. It currently fails at cropped images and works only with JPGs.

It calculates the perceptual image hash of all images in the given directory based on an algorithm described in
"Bian Yang; Fan Gu; XiaMu Niu, "Block Mean Value Based Image Perceptual Hashing," Intelligent Information Hiding and
Multimedia Signal Processing, 2006. IIH-MSP '06. International Conference on , vol., no., pp.167,172, Dec. 2006".

Images with similar hashes are grouped using the hamming distance and the result is printed out to the console.

Usage:
-----

```
  $ node uniqueImages.js ~/Pictures/Mongolia 2012
```

License
-------

Distributed under an MIT license, please see LICENSE in the top dir.
