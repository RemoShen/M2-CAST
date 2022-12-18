import { ICoord, ISize } from "../../redux/global-interfaces";
import {
  centroid,
  distanceTo,
  rotateBy,
  scaleTo,
  translateTo,
  vectorize,
} from "./tool";
import Util from "./util";

export interface IRecogResult {
  name: string;
  score: number;
  time: number;
}

class DrawnStroke {
  static numPoints: number = 64;
  static squareSize: number = 250;

  origin: ICoord;
  name: string;
  points: ICoord[];
  vector: number[];

  constructor(name: string, points: ICoord[]) {
    this.origin = { x: 0, y: 0 };
    this.name = name;
    this.points = this.resample(points, DrawnStroke.numPoints);
    let radians = this.indicativeAngle(this.points);
    let squareSize = DrawnStroke.squareSize;
    this.points = rotateBy(this.points, -radians);
    this.points = scaleTo(this.points, squareSize);
    this.points = translateTo(this.points, this.origin);
    this.vector = vectorize(this.points); // for Protractor
  }

  pathLength(points: ICoord[]): number {
    let d = 0.0;
    for (let i = 1; i < points.length; i++)
      d += distanceTo(points[i - 1], points[i]);
    return d;
  }

  resample(points: ICoord[], n: number): ICoord[] {
    let I = this.pathLength(points) / (n - 1); // interval length
    let D = 0.0;
    let newpoints = new Array(points[0]);
    for (let i = 1; i < points.length; i++) {
      let d = distanceTo(points[i - 1], points[i]);
      if (D + d >= I) {
        let qx =
          points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
        let qy =
          points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
        let q = { x: qx, y: qy };
        newpoints.push(q); // append new point 'q'
        points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
        D = 0.0;
      } else {
        D += d;
      }
    }
    if (newpoints.length == n - 1) {
      // somtimes we fall a rounding-error short of adding the last point, so add it if so
      newpoints.push({
        x: points[points.length - 1].x,
        y: points[points.length - 1].y,
      });
    }
    return newpoints;
  }

  indicativeAngle(points: ICoord[]): number {
    let c = centroid(points);
    return Math.atan2(c.y - points[0].y, c.x - points[0].x);
  }
}

export default class PathRecognizer {
  numUnistrokes: number;
  angleRange: number;
  anglePrecision: number;
  phi: number;
  gestures: DrawnStroke[];

  public static CHECK: string = "check";
  public static CANCEL: string = "x";
  constructor() {
    this.numUnistrokes = 3;
    this.angleRange = (45.0 * Math.PI) / 180.0;
    this.anglePrecision = (2.0 * Math.PI) / 180.0;
    this.phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio

    this.gestures = [];
    // this.gestures.push(new DrawnStroke("check", [{ x: 91, y: 185 }, { x: 93, y: 185 }, { x: 95, y: 185 }, { x: 97, y: 185 }, { x: 100, y: 188 }, { x: 102, y: 189 }, { x: 104, y: 190 }, { x: 106, y: 193 }, { x: 108, y: 195 }, { x: 110, y: 198 }, { x: 112, y: 201 }, { x: 114, y: 204 }, { x: 115, y: 207 }, { x: 117, y: 210 }, { x: 118, y: 212 }, { x: 120, y: 214 }, { x: 121, y: 217 }, { x: 122, y: 219 }, { x: 123, y: 222 }, { x: 124, y: 224 }, { x: 126, y: 226 }, { x: 127, y: 229 }, { x: 129, y: 231 }, { x: 130, y: 233 }, { x: 129, y: 231 }, { x: 129, y: 228 }, { x: 129, y: 226 }, { x: 129, y: 224 }, { x: 129, y: 221 }, { x: 129, y: 218 }, { x: 129, y: 212 }, { x: 129, y: 208 }, { x: 130, y: 198 }, { x: 132, y: 189 }, { x: 134, y: 182 }, { x: 137, y: 173 }, { x: 143, y: 164 }, { x: 147, y: 157 }, { x: 151, y: 151 }, { x: 155, y: 144 }, { x: 161, y: 137 }, { x: 165, y: 131 }, { x: 171, y: 122 }, { x: 174, y: 118 }, { x: 176, y: 114 }, { x: 177, y: 112 }, { x: 177, y: 114 }, { x: 175, y: 116 }, { x: 173, y: 118 }]));
    // this.gestures.push(new DrawnStroke('arrow', [{ x: 251, y: 295 }, { x: 251, y: 295 }, { x: 253, y: 295 }, { x: 254, y: 295 }, { x: 255, y: 295 }, { x: 256, y: 295 }, { x: 256, y: 294 }, { x: 257, y: 294 }, { x: 258, y: 294 }, { x: 259, y: 294 }, { x: 259, y: 293 }, { x: 260, y: 293 }, { x: 261, y: 293 }, { x: 262, y: 293 }, { x: 263, y: 293 }, { x: 264, y: 293 }, { x: 265, y: 293 }, { x: 266, y: 293 }, { x: 267, y: 293 }, { x: 268, y: 293 }, { x: 269, y: 293 }, { x: 270, y: 293 }, { x: 270, y: 292 }, { x: 271, y: 292 }, { x: 272, y: 292 }, { x: 273, y: 292 }, { x: 274, y: 292 }, { x: 275, y: 292 }, { x: 276, y: 292 }, { x: 277, y: 292 }, { x: 278, y: 292 }, { x: 279, y: 292 }, { x: 280, y: 292 }, { x: 281, y: 291 }, { x: 282, y: 291 }, { x: 283, y: 291 }, { x: 284, y: 291 }, { x: 285, y: 291 }, { x: 286, y: 291 }, { x: 287, y: 291 }, { x: 288, y: 291 }, { x: 289, y: 291 }, { x: 290, y: 291 }, { x: 291, y: 291 }, { x: 292, y: 291 }, { x: 293, y: 291 }, { x: 294, y: 291 }, { x: 295, y: 291 }, { x: 296, y: 291 }, { x: 297, y: 291 }, { x: 298, y: 291 }, { x: 299, y: 291 }, { x: 300, y: 291 }, { x: 301, y: 291 }, { x: 302, y: 291 }, { x: 303, y: 291 }, { x: 304, y: 291 }, { x: 305, y: 291 }, { x: 306, y: 291 }, { x: 307, y: 291 }, { x: 308, y: 293 }, { x: 309, y: 293 }, { x: 310, y: 293 }, { x: 311, y: 293 }, { x: 312, y: 293 }, { x: 313, y: 293 }, { x: 315, y: 294 }, { x: 316, y: 294 }, { x: 317, y: 294 }, { x: 318, y: 294 }, { x: 320, y: 294 }, { x: 321, y: 294 }, { x: 322, y: 294 }, { x: 323, y: 294 }, { x: 325, y: 294 }, { x: 326, y: 294 }, { x: 327, y: 294 }, { x: 329, y: 294 }, { x: 330, y: 294 }, { x: 332, y: 294 }, { x: 333, y: 294 }, { x: 335, y: 294 }, { x: 337, y: 294 }, { x: 338, y: 294 }, { x: 340, y: 294 }, { x: 341, y: 294 }, { x: 342, y: 294 }, { x: 344, y: 294 }, { x: 345, y: 294 }, { x: 346, y: 294 }, { x: 348, y: 294 }, { x: 350, y: 294 }, { x: 351, y: 294 }, { x: 352, y: 294 }, { x: 353, y: 294 }, { x: 354, y: 294 }, { x: 355, y: 294 }, { x: 356, y: 294 }, { x: 357, y: 294 }, { x: 358, y: 294 }, { x: 359, y: 295 }, { x: 360, y: 295 }, { x: 361, y: 295 }, { x: 362, y: 295 }, { x: 363, y: 295 }, { x: 364, y: 295 }, { x: 365, y: 295 }, { x: 366, y: 295 }, { x: 367, y: 295 }, { x: 368, y: 295 }, { x: 369, y: 295 }, { x: 370, y: 295 }, { x: 371, y: 295 }, { x: 372, y: 295 }, { x: 373, y: 295 }, { x: 374, y: 295 }, { x: 375, y: 296 }, { x: 376, y: 296 }, { x: 377, y: 296 }, { x: 378, y: 296 }, { x: 379, y: 296 }, { x: 380, y: 296 }, { x: 381, y: 296 }, { x: 382, y: 296 }, { x: 383, y: 296 }, { x: 384, y: 296 }, { x: 385, y: 296 }, { x: 386, y: 296 }, { x: 387, y: 296 }, { x: 389, y: 296 }, { x: 390, y: 296 }, { x: 391, y: 296 }, { x: 392, y: 296 }, { x: 393, y: 296 }, { x: 394, y: 296 }, { x: 395, y: 296 }, { x: 396, y: 296 }, { x: 397, y: 296 }, { x: 398, y: 296 }, { x: 399, y: 296 }, { x: 400, y: 296 }, { x: 401, y: 296 }, { x: 402, y: 296 }, { x: 403, y: 296 }, { x: 404, y: 296 }, { x: 405, y: 296 }, { x: 406, y: 296 }, { x: 407, y: 296 }, { x: 408, y: 296 }, { x: 409, y: 296 }, { x: 410, y: 296 }, { x: 411, y: 296 }, { x: 412, y: 296 }, { x: 413, y: 296 }, { x: 414, y: 296 }, { x: 415, y: 296 }, { x: 416, y: 296 }, { x: 417, y: 296 }, { x: 418, y: 296 }, { x: 419, y: 296 }, { x: 420, y: 296 }, { x: 421, y: 296 }, { x: 422, y: 296 }, { x: 423, y: 296 }, { x: 424, y: 296 }, { x: 425, y: 296 }, { x: 426, y: 296 }, { x: 427, y: 296 }, { x: 428, y: 296 }, { x: 429, y: 296 }, { x: 430, y: 296 }, { x: 431, y: 296 }, { x: 432, y: 296 }, { x: 433, y: 296 }, { x: 434, y: 296 }, { x: 435, y: 296 }, { x: 436, y: 296 }, { x: 437, y: 296 }, { x: 438, y: 296 }, { x: 439, y: 296 }, { x: 440, y: 296 }, { x: 441, y: 296 }, { x: 442, y: 296 }, { x: 443, y: 296 }, { x: 444, y: 296 }, { x: 445, y: 296 }, { x: 369, y: 266 }, { x: 371, y: 266 }, { x: 372, y: 266 }, { x: 373, y: 266 }, { x: 374, y: 266 }, { x: 375, y: 266 }, { x: 376, y: 266 }, { x: 377, y: 266 }, { x: 378, y: 266 }, { x: 379, y: 266 }, { x: 379, y: 268 }, { x: 380, y: 268 }, { x: 381, y: 268 }, { x: 382, y: 269 }, { x: 383, y: 269 }, { x: 384, y: 269 }, { x: 384, y: 270 }, { x: 386, y: 270 }, { x: 386, y: 271 }, { x: 387, y: 271 }, { x: 388, y: 271 }, { x: 389, y: 272 }, { x: 390, y: 272 }, { x: 391, y: 272 }, { x: 392, y: 273 }, { x: 393, y: 273 }, { x: 394, y: 273 }, { x: 395, y: 274 }, { x: 396, y: 274 }, { x: 397, y: 274 }, { x: 399, y: 274 }, { x: 399, y: 275 }, { x: 400, y: 275 }, { x: 401, y: 276 }, { x: 402, y: 276 }, { x: 403, y: 276 }, { x: 405, y: 277 }, { x: 407, y: 277 }, { x: 407, y: 278 }, { x: 408, y: 278 }, { x: 409, y: 278 }, { x: 410, y: 278 }, { x: 410, y: 279 }, { x: 411, y: 279 }, { x: 412, y: 279 }, { x: 413, y: 279 }, { x: 414, y: 279 }, { x: 414, y: 280 }, { x: 415, y: 280 }, { x: 416, y: 280 }, { x: 417, y: 281 }, { x: 418, y: 281 }, { x: 419, y: 282 }, { x: 420, y: 282 }, { x: 421, y: 282 }, { x: 421, y: 283 }, { x: 422, y: 283 }, { x: 423, y: 283 }, { x: 424, y: 284 }, { x: 425, y: 284 }, { x: 426, y: 285 }, { x: 427, y: 285 }, { x: 428, y: 285 }, { x: 429, y: 286 }, { x: 430, y: 286 }, { x: 431, y: 286 }, { x: 432, y: 287 }, { x: 433, y: 287 }, { x: 434, y: 288 }, { x: 435, y: 288 }, { x: 435, y: 289 }, { x: 436, y: 289 }, { x: 437, y: 289 }, { x: 438, y: 289 }, { x: 439, y: 289 }, { x: 440, y: 289 }, { x: 440, y: 290 }, { x: 441, y: 290 }, { x: 442, y: 291 }, { x: 443, y: 291 }, { x: 444, y: 291 }, { x: 444, y: 292 }, { x: 445, y: 292 }, { x: 446, y: 292 }, { x: 446, y: 293 }, { x: 447, y: 293 }, { x: 448, y: 293 }, { x: 449, y: 293 }, { x: 450, y: 294 }, { x: 451, y: 294 }, { x: 451, y: 295 }, { x: 452, y: 295 }, { x: 453, y: 295 }, { x: 454, y: 295 }, { x: 455, y: 296 }, { x: 456, y: 296 }, { x: 457, y: 296 }, { x: 457, y: 297 }, { x: 458, y: 297 }, { x: 459, y: 297 }, { x: 460, y: 297 }, { x: 461, y: 298 }, { x: 462, y: 298 }, { x: 463, y: 298 }, { x: 463, y: 299 }, { x: 464, y: 299 }, { x: 465, y: 299 }, { x: 466, y: 299 }, { x: 466, y: 300 }, { x: 464, y: 300 }, { x: 463, y: 300 }, { x: 462, y: 301 }, { x: 461, y: 301 }, { x: 460, y: 301 }, { x: 459, y: 301 }, { x: 458, y: 302 }, { x: 457, y: 302 }, { x: 456, y: 302 }, { x: 456, y: 303 }, { x: 455, y: 303 }, { x: 454, y: 303 }, { x: 454, y: 304 }, { x: 453, y: 304 }, { x: 452, y: 304 }, { x: 451, y: 304 }, { x: 451, y: 305 }, { x: 450, y: 305 }, { x: 449, y: 306 }, { x: 448, y: 306 }, { x: 447, y: 307 }, { x: 446, y: 307 }, { x: 445, y: 307 }, { x: 445, y: 308 }, { x: 444, y: 308 }, { x: 443, y: 308 }, { x: 443, y: 309 }, { x: 442, y: 309 }, { x: 442, y: 310 }, { x: 441, y: 310 }, { x: 440, y: 310 }, { x: 439, y: 310 }, { x: 439, y: 311 }, { x: 438, y: 311 }, { x: 438, y: 312 }, { x: 437, y: 312 }, { x: 436, y: 312 }, { x: 435, y: 313 }, { x: 434, y: 313 }, { x: 434, y: 314 }, { x: 433, y: 314 }, { x: 432, y: 314 }, { x: 431, y: 315 }, { x: 430, y: 315 }, { x: 429, y: 315 }, { x: 428, y: 316 }, { x: 427, y: 316 }, { x: 426, y: 316 }, { x: 426, y: 317 }, { x: 425, y: 317 }, { x: 424, y: 317 }, { x: 424, y: 318 }, { x: 423, y: 318 }, { x: 422, y: 318 }, { x: 422, y: 319 }, { x: 421, y: 319 }, { x: 420, y: 319 }, { x: 419, y: 319 }, { x: 419, y: 320 }, { x: 418, y: 320 }, { x: 417, y: 320 }, { x: 416, y: 321 }, { x: 415, y: 321 }, { x: 414, y: 321 }, { x: 414, y: 322 }, { x: 413, y: 322 }, { x: 412, y: 322 }, { x: 411, y: 322 }, { x: 411, y: 323 }, { x: 410, y: 323 }, { x: 409, y: 323 }, { x: 409, y: 324 }, { x: 408, y: 324 }, { x: 407, y: 324 }, { x: 407, y: 325 }, { x: 406, y: 325 }, { x: 405, y: 326 }, { x: 404, y: 326 }, { x: 404, y: 327 }, { x: 403, y: 327 }, { x: 402, y: 327 }, { x: 401, y: 328 }, { x: 401, y: 329 }, { x: 400, y: 329 }, { x: 399, y: 329 }, { x: 398, y: 329 }, { x: 398, y: 330 }, { x: 397, y: 330 }]));
    // this.gestures.push(new DrawnStroke('arrow', [{ x: 576, y: 354 }, { x: 574, y: 354 }, { x: 573, y: 354 }, { x: 572, y: 354 }, { x: 571, y: 354 }, { x: 570, y: 354 }, { x: 569, y: 354 }, { x: 568, y: 354 }, { x: 567, y: 354 }, { x: 566, y: 354 }, { x: 565, y: 354 }, { x: 564, y: 354 }, { x: 563, y: 354 }, { x: 562, y: 354 }, { x: 561, y: 354 }, { x: 560, y: 354 }, { x: 559, y: 354 }, { x: 558, y: 354 }, { x: 557, y: 354 }, { x: 555, y: 354 }, { x: 554, y: 354 }, { x: 552, y: 354 }, { x: 551, y: 354 }, { x: 549, y: 354 }, { x: 547, y: 354 }, { x: 546, y: 356 }, { x: 544, y: 356 }, { x: 542, y: 356 }, { x: 540, y: 356 }, { x: 539, y: 356 }, { x: 537, y: 356 }, { x: 535, y: 356 }, { x: 533, y: 356 }, { x: 531, y: 356 }, { x: 529, y: 356 }, { x: 527, y: 356 }, { x: 525, y: 356 }, { x: 523, y: 356 }, { x: 521, y: 356 }, { x: 519, y: 357 }, { x: 518, y: 357 }, { x: 516, y: 357 }, { x: 514, y: 357 }, { x: 513, y: 357 }, { x: 511, y: 357 }, { x: 509, y: 357 }, { x: 507, y: 357 }, { x: 505, y: 357 }, { x: 504, y: 357 }, { x: 502, y: 357 }, { x: 500, y: 357 }, { x: 498, y: 357 }, { x: 497, y: 357 }, { x: 495, y: 357 }, { x: 493, y: 357 }, { x: 491, y: 357 }, { x: 489, y: 357 }, { x: 487, y: 357 }, { x: 485, y: 357 }, { x: 483, y: 357 }, { x: 481, y: 357 }, { x: 479, y: 357 }, { x: 477, y: 357 }, { x: 474, y: 357 }, { x: 472, y: 357 }, { x: 469, y: 357 }, { x: 467, y: 357 }, { x: 464, y: 357 }, { x: 461, y: 357 }, { x: 458, y: 355 }, { x: 456, y: 355 }, { x: 453, y: 355 }, { x: 450, y: 355 }, { x: 447, y: 355 }, { x: 444, y: 355 }, { x: 441, y: 354 }, { x: 438, y: 354 }, { x: 434, y: 354 }, { x: 431, y: 354 }, { x: 428, y: 354 }, { x: 425, y: 354 }, { x: 422, y: 354 }, { x: 418, y: 354 }, { x: 415, y: 354 }, { x: 412, y: 354 }, { x: 409, y: 354 }, { x: 406, y: 354 }, { x: 403, y: 354 }, { x: 399, y: 354 }, { x: 396, y: 354 }, { x: 393, y: 354 }, { x: 390, y: 354 }, { x: 387, y: 354 }, { x: 384, y: 354 }, { x: 381, y: 354 }, { x: 378, y: 354 }, { x: 375, y: 354 }, { x: 372, y: 354 }, { x: 369, y: 354 }, { x: 367, y: 354 }, { x: 364, y: 354 }, { x: 361, y: 354 }, { x: 359, y: 354 }, { x: 356, y: 354 }, { x: 354, y: 354 }, { x: 352, y: 354 }, { x: 350, y: 354 }, { x: 348, y: 356 }, { x: 346, y: 356 }, { x: 344, y: 356 }, { x: 342, y: 356 }, { x: 341, y: 356 }, { x: 339, y: 356 }, { x: 337, y: 356 }, { x: 336, y: 356 }, { x: 334, y: 356 }, { x: 333, y: 356 }, { x: 331, y: 356 }, { x: 330, y: 356 }, { x: 329, y: 356 }, { x: 327, y: 356 }, { x: 326, y: 356 }, { x: 325, y: 356 }, { x: 323, y: 356 }, { x: 322, y: 356 }, { x: 321, y: 356 }, { x: 319, y: 356 }, { x: 318, y: 356 }, { x: 317, y: 356 }, { x: 316, y: 356 }, { x: 314, y: 356 }, { x: 313, y: 356 }, { x: 312, y: 356 }, { x: 310, y: 356 }, { x: 309, y: 356 }, { x: 308, y: 356 }, { x: 307, y: 356 }, { x: 306, y: 356 }, { x: 305, y: 356 }, { x: 303, y: 356 }, { x: 301, y: 356 }, { x: 300, y: 356 }, { x: 299, y: 356 }, { x: 298, y: 356 }, { x: 296, y: 356 }, { x: 295, y: 356 }, { x: 294, y: 356 }, { x: 293, y: 356 }, { x: 292, y: 356 }, { x: 291, y: 356 }, { x: 290, y: 356 }, { x: 289, y: 356 }, { x: 288, y: 356 }, { x: 287, y: 356 }, { x: 286, y: 356 }, { x: 285, y: 356 }, { x: 284, y: 356 }, { x: 283, y: 356 }, { x: 282, y: 356 }, { x: 281, y: 356 }, { x: 280, y: 356 }, { x: 279, y: 356 }, { x: 278, y: 356 }, { x: 277, y: 356 }, { x: 276, y: 356 }, { x: 275, y: 356 }, { x: 274, y: 356 }, { x: 273, y: 356 }, { x: 272, y: 356 }, { x: 271, y: 356 }, { x: 270, y: 356 }, { x: 269, y: 356 }, { x: 268, y: 356 }, { x: 267, y: 356 }, { x: 266, y: 356 }, { x: 265, y: 356 }, { x: 264, y: 356 }, { x: 263, y: 356 }, { x: 262, y: 356 }, { x: 260, y: 356 }, { x: 259, y: 356 }, { x: 258, y: 356 }, { x: 257, y: 356 }, { x: 256, y: 356 }, { x: 255, y: 356 }, { x: 254, y: 356 }, { x: 253, y: 356 }, { x: 252, y: 356 }, { x: 251, y: 356 }, { x: 250, y: 356 }, { x: 249, y: 356 }, { x: 248, y: 356 }, { x: 247, y: 356 }, { x: 246, y: 356 }, { x: 245, y: 356 }, { x: 244, y: 356 }, { x: 243, y: 356 }, { x: 242, y: 356 }, { x: 241, y: 356 }, { x: 240, y: 356 }, { x: 239, y: 356 }, { x: 238, y: 356 }, { x: 237, y: 356 }, { x: 236, y: 356 }, { x: 235, y: 356 }, { x: 234, y: 356 }, { x: 233, y: 356 }, { x: 232, y: 356 }, { x: 231, y: 356 }, { x: 230, y: 356 }, { x: 229, y: 356 }, { x: 228, y: 356 }, { x: 227, y: 356 }, { x: 226, y: 356 }, { x: 226, y: 354 }, { x: 250, y: 337 }, { x: 249, y: 337 }, { x: 248, y: 337 }, { x: 247, y: 337 }, { x: 246, y: 337 }, { x: 246, y: 338 }, { x: 245, y: 338 }, { x: 244, y: 338 }, { x: 243, y: 338 }, { x: 243, y: 339 }, { x: 242, y: 339 }, { x: 241, y: 339 }, { x: 240, y: 340 }, { x: 239, y: 340 }, { x: 238, y: 340 }, { x: 238, y: 341 }, { x: 237, y: 341 }, { x: 236, y: 341 }, { x: 235, y: 342 }, { x: 234, y: 342 }, { x: 233, y: 342 }, { x: 232, y: 342 }, { x: 231, y: 342 }, { x: 230, y: 343 }, { x: 229, y: 343 }, { x: 228, y: 343 }, { x: 227, y: 344 }, { x: 226, y: 344 }, { x: 225, y: 344 }, { x: 224, y: 345 }, { x: 223, y: 345 }, { x: 222, y: 346 }, { x: 221, y: 346 }, { x: 219, y: 346 }, { x: 218, y: 347 }, { x: 217, y: 347 }, { x: 216, y: 348 }, { x: 214, y: 348 }, { x: 213, y: 349 }, { x: 212, y: 349 }, { x: 211, y: 350 }, { x: 210, y: 350 }, { x: 209, y: 350 }, { x: 208, y: 350 }, { x: 207, y: 351 }, { x: 206, y: 351 }, { x: 205, y: 352 }, { x: 204, y: 352 }, { x: 203, y: 352 }, { x: 202, y: 352 }, { x: 202, y: 353 }, { x: 201, y: 353 }, { x: 200, y: 353 }, { x: 200, y: 354 }, { x: 199, y: 354 }, { x: 198, y: 354 }, { x: 198, y: 355 }, { x: 200, y: 355 }, { x: 201, y: 355 }, { x: 202, y: 355 }, { x: 202, y: 356 }, { x: 203, y: 356 }, { x: 204, y: 356 }, { x: 205, y: 357 }, { x: 206, y: 357 }, { x: 206, y: 358 }, { x: 207, y: 358 }, { x: 208, y: 358 }, { x: 209, y: 358 }, { x: 210, y: 359 }, { x: 211, y: 360 }, { x: 212, y: 360 }, { x: 213, y: 361 }, { x: 214, y: 361 }, { x: 216, y: 362 }, { x: 218, y: 363 }, { x: 219, y: 363 }, { x: 220, y: 364 }, { x: 221, y: 365 }, { x: 222, y: 365 }, { x: 223, y: 366 }, { x: 225, y: 366 }, { x: 226, y: 367 }, { x: 227, y: 368 }, { x: 227, y: 369 }, { x: 229, y: 369 }, { x: 230, y: 369 }, { x: 230, y: 370 }, { x: 232, y: 370 }, { x: 233, y: 371 }, { x: 234, y: 371 }, { x: 235, y: 372 }, { x: 236, y: 372 }, { x: 237, y: 372 }, { x: 238, y: 373 }, { x: 239, y: 373 }, { x: 240, y: 374 }, { x: 241, y: 374 }, { x: 242, y: 374 }, { x: 243, y: 374 }, { x: 244, y: 375 }, { x: 245, y: 375 }, { x: 246, y: 376 }, { x: 247, y: 376 }, { x: 248, y: 376 }, { x: 249, y: 376 }, { x: 250, y: 377 }, { x: 251, y: 377 }, { x: 252, y: 378 }, { x: 253, y: 378 }, { x: 254, y: 378 }, { x: 255, y: 379 }, { x: 256, y: 379 }, { x: 256, y: 380 }, { x: 257, y: 380 }, { x: 258, y: 380 }, { x: 259, y: 381 }, { x: 260, y: 382 }, { x: 261, y: 382 }, { x: 262, y: 382 }, { x: 263, y: 383 }, { x: 264, y: 383 }, { x: 265, y: 383 }, { x: 266, y: 383 }, { x: 266, y: 384 }, { x: 267, y: 384 }, { x: 268, y: 384 }, { x: 268, y: 385 }, { x: 269, y: 385 }, { x: 270, y: 386 }, { x: 271, y: 386 }, { x: 271, y: 387 }, { x: 272, y: 387 }]));
    // this.gestures[0] = new UniStroke("triangle", new Array(new Point(137, 139), new Point(135, 141), new Point(133, 144), new Point(132, 146), new Point(130, 149), new Point(128, 151), new Point(126, 155), new Point(123, 160), new Point(120, 166), new Point(116, 171), new Point(112, 177), new Point(107, 183), new Point(102, 188), new Point(100, 191), new Point(95, 195), new Point(90, 199), new Point(86, 203), new Point(82, 206), new Point(80, 209), new Point(75, 213), new Point(73, 213), new Point(70, 216), new Point(67, 219), new Point(64, 221), new Point(61, 223), new Point(60, 225), new Point(62, 226), new Point(65, 225), new Point(67, 226), new Point(74, 226), new Point(77, 227), new Point(85, 229), new Point(91, 230), new Point(99, 231), new Point(108, 232), new Point(116, 233), new Point(125, 233), new Point(134, 234), new Point(145, 233), new Point(153, 232), new Point(160, 233), new Point(170, 234), new Point(177, 235), new Point(179, 236), new Point(186, 237), new Point(193, 238), new Point(198, 239), new Point(200, 237), new Point(202, 239), new Point(204, 238), new Point(206, 234), new Point(205, 230), new Point(202, 222), new Point(197, 216), new Point(192, 207), new Point(186, 198), new Point(179, 189), new Point(174, 183), new Point(170, 178), new Point(164, 171), new Point(161, 168), new Point(154, 160), new Point(148, 155), new Point(143, 150), new Point(138, 148), new Point(136, 148)));
    // this.gestures[1] = new UniStroke("x", new Array(new Point(87, 142), new Point(89, 145), new Point(91, 148), new Point(93, 151), new Point(96, 155), new Point(98, 157), new Point(100, 160), new Point(102, 162), new Point(106, 167), new Point(108, 169), new Point(110, 171), new Point(115, 177), new Point(119, 183), new Point(123, 189), new Point(127, 193), new Point(129, 196), new Point(133, 200), new Point(137, 206), new Point(140, 209), new Point(143, 212), new Point(146, 215), new Point(151, 220), new Point(153, 222), new Point(155, 223), new Point(157, 225), new Point(158, 223), new Point(157, 218), new Point(155, 211), new Point(154, 208), new Point(152, 200), new Point(150, 189), new Point(148, 179), new Point(147, 170), new Point(147, 158), new Point(147, 148), new Point(147, 141), new Point(147, 136), new Point(144, 135), new Point(142, 137), new Point(140, 139), new Point(135, 145), new Point(131, 152), new Point(124, 163), new Point(116, 177), new Point(108, 191), new Point(100, 206), new Point(94, 217), new Point(91, 222), new Point(89, 225), new Point(87, 226), new Point(87, 224)));
    // this.gestures[2] = new UniStroke("rectangle", new Array(new Point(78, 149), new Point(78, 153), new Point(78, 157), new Point(78, 160), new Point(79, 162), new Point(79, 164), new Point(79, 167), new Point(79, 169), new Point(79, 173), new Point(79, 178), new Point(79, 183), new Point(80, 189), new Point(80, 193), new Point(80, 198), new Point(80, 202), new Point(81, 208), new Point(81, 210), new Point(81, 216), new Point(82, 222), new Point(82, 224), new Point(82, 227), new Point(83, 229), new Point(83, 231), new Point(85, 230), new Point(88, 232), new Point(90, 233), new Point(92, 232), new Point(94, 233), new Point(99, 232), new Point(102, 233), new Point(106, 233), new Point(109, 234), new Point(117, 235), new Point(123, 236), new Point(126, 236), new Point(135, 237), new Point(142, 238), new Point(145, 238), new Point(152, 238), new Point(154, 239), new Point(165, 238), new Point(174, 237), new Point(179, 236), new Point(186, 235), new Point(191, 235), new Point(195, 233), new Point(197, 233), new Point(200, 233), new Point(201, 235), new Point(201, 233), new Point(199, 231), new Point(198, 226), new Point(198, 220), new Point(196, 207), new Point(195, 195), new Point(195, 181), new Point(195, 173), new Point(195, 163), new Point(194, 155), new Point(192, 145), new Point(192, 143), new Point(192, 138), new Point(191, 135), new Point(191, 133), new Point(191, 130), new Point(190, 128), new Point(188, 129), new Point(186, 129), new Point(181, 132), new Point(173, 131), new Point(162, 131), new Point(151, 132), new Point(149, 132), new Point(138, 132), new Point(136, 132), new Point(122, 131), new Point(120, 131), new Point(109, 130), new Point(107, 130), new Point(90, 132), new Point(81, 133), new Point(76, 133)));
    // this.gestures[3] = new UniStroke("circle", new Array(new Point(127, 141), new Point(124, 140), new Point(120, 139), new Point(118, 139), new Point(116, 139), new Point(111, 140), new Point(109, 141), new Point(104, 144), new Point(100, 147), new Point(96, 152), new Point(93, 157), new Point(90, 163), new Point(87, 169), new Point(85, 175), new Point(83, 181), new Point(82, 190), new Point(82, 195), new Point(83, 200), new Point(84, 205), new Point(88, 213), new Point(91, 216), new Point(96, 219), new Point(103, 222), new Point(108, 224), new Point(111, 224), new Point(120, 224), new Point(133, 223), new Point(142, 222), new Point(152, 218), new Point(160, 214), new Point(167, 210), new Point(173, 204), new Point(178, 198), new Point(179, 196), new Point(182, 188), new Point(182, 177), new Point(178, 167), new Point(170, 150), new Point(163, 138), new Point(152, 130), new Point(143, 129), new Point(140, 131), new Point(129, 136), new Point(126, 139)));
    this.gestures.push(
      new DrawnStroke("x", [
        { x: 87, y: 142 },
        { x: 89, y: 145 },
        { x: 91, y: 148 },
        { x: 93, y: 151 },
        { x: 96, y: 155 },
        { x: 98, y: 157 },
        { x: 100, y: 160 },
        { x: 102, y: 162 },
        { x: 106, y: 167 },
        { x: 108, y: 169 },
        { x: 110, y: 171 },
        { x: 115, y: 177 },
        { x: 119, y: 183 },
        { x: 123, y: 189 },
        { x: 127, y: 193 },
        { x: 129, y: 196 },
        { x: 133, y: 200 },
        { x: 137, y: 206 },
        { x: 140, y: 209 },
        { x: 143, y: 212 },
        { x: 146, y: 215 },
        { x: 151, y: 220 },
        { x: 153, y: 222 },
        { x: 155, y: 223 },
        { x: 157, y: 225 },
        { x: 158, y: 223 },
        { x: 157, y: 218 },
        { x: 155, y: 211 },
        { x: 154, y: 208 },
        { x: 152, y: 200 },
        { x: 150, y: 189 },
        { x: 148, y: 179 },
        { x: 147, y: 170 },
        { x: 147, y: 158 },
        { x: 147, y: 148 },
        { x: 147, y: 141 },
        { x: 147, y: 136 },
        { x: 144, y: 135 },
        { x: 142, y: 137 },
        { x: 140, y: 139 },
        { x: 135, y: 145 },
        { x: 131, y: 152 },
        { x: 124, y: 163 },
        { x: 116, y: 177 },
        { x: 108, y: 191 },
        { x: 100, y: 206 },
        { x: 94, y: 217 },
        { x: 91, y: 222 },
        { x: 89, y: 225 },
        { x: 87, y: 226 },
        { x: 87, y: 224 },
      ])
    );
    this.gestures.push(
      new DrawnStroke("check", [
        { x: 91, y: 185 },
        { x: 93, y: 185 },
        { x: 95, y: 185 },
        { x: 97, y: 185 },
        { x: 100, y: 188 },
        { x: 102, y: 189 },
        { x: 104, y: 190 },
        { x: 106, y: 193 },
        { x: 108, y: 195 },
        { x: 110, y: 198 },
        { x: 112, y: 201 },
        { x: 114, y: 204 },
        { x: 115, y: 207 },
        { x: 117, y: 210 },
        { x: 118, y: 212 },
        { x: 120, y: 214 },
        { x: 121, y: 217 },
        { x: 122, y: 219 },
        { x: 123, y: 222 },
        { x: 124, y: 224 },
        { x: 126, y: 226 },
        { x: 127, y: 229 },
        { x: 129, y: 231 },
        { x: 130, y: 233 },
        { x: 129, y: 231 },
        { x: 129, y: 228 },
        { x: 129, y: 226 },
        { x: 129, y: 224 },
        { x: 129, y: 221 },
        { x: 129, y: 218 },
        { x: 129, y: 212 },
        { x: 129, y: 208 },
        { x: 130, y: 198 },
        { x: 132, y: 189 },
        { x: 134, y: 182 },
        { x: 137, y: 173 },
        { x: 143, y: 164 },
        { x: 147, y: 157 },
        { x: 151, y: 151 },
        { x: 155, y: 144 },
        { x: 161, y: 137 },
        { x: 165, y: 131 },
        { x: 171, y: 122 },
        { x: 174, y: 118 },
        { x: 176, y: 114 },
        { x: 177, y: 112 },
        { x: 177, y: 114 },
        { x: 175, y: 116 },
        { x: 173, y: 118 },
      ])
    );
  }

  optimalCosineDistance(v1: number[], v2: number[]): number {
    let a = 0.0;
    let b = 0.0;
    for (let i = 0; i < v1.length; i += 2) {
      a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
      b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
    }
    let angle = Math.atan(b / a);
    return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
  }

  pathDistance(pts1: ICoord[], pts2: ICoord[]): number {
    let d = 0.0;
    for (let i = 0; i < pts1.length; i++) {
      // assumes pts1.length == pts2.length
      d += distanceTo(pts1[i], pts2[i]);
    }
    return d / pts1.length;
  }

  distanceAtAngle(points: ICoord[], T: DrawnStroke, radians: number): number {
    let newpoints = rotateBy(points, radians);
    return this.pathDistance(newpoints, T.points);
  }

  distanceAtBestAngle(
    points: ICoord[],
    T: DrawnStroke,
    a: number,
    b: number,
    threshold: number
  ): number {
    let x1 = this.phi * a + (1.0 - this.phi) * b;
    let f1 = this.distanceAtAngle(points, T, x1);
    let x2 = (1.0 - this.phi) * a + this.phi * b;
    let f2 = this.distanceAtAngle(points, T, x2);
    while (Math.abs(b - a) > threshold) {
      if (f1 < f2) {
        b = x2;
        x2 = x1;
        f2 = f1;
        x1 = this.phi * a + (1.0 - this.phi) * b;
        f1 = this.distanceAtAngle(points, T, x1);
      } else {
        a = x1;
        x1 = x2;
        f1 = f2;
        x2 = (1.0 - this.phi) * a + this.phi * b;
        f2 = this.distanceAtAngle(points, T, x2);
      }
    }
    return Math.min(f1, f2);
  }

  recognize(points: ICoord[], useProtractor: boolean): IRecogResult {
    let t0 = Date.now();
    let candidate = new DrawnStroke("", points);

    let u = -1;
    let b = +Infinity;
    for (let i = 0; i < this.gestures.length; i++) {
      let d;
      if (useProtractor)
        d = this.optimalCosineDistance(
          this.gestures[i].vector,
          candidate.vector
        ); // Protractor
      else
        d = this.distanceAtBestAngle(
          candidate.points,
          this.gestures[i],
          -this.angleRange,
          +this.angleRange,
          this.anglePrecision
        ); // Golden Section Search (original $1)
      if (d < b) {
        b = d; // best (least) distance
        u = i; // unistroke index
      }
    }
    let t1 = Date.now();
    return u === -1 || 1.0 - b <= 0.4
      ? { name: "No match.", score: 0.0, time: t1 - t0 }
      : { name: this.gestures[u].name, score: 1.0 - b, time: t1 - t0 };
  }

  addGesture(name: string, points: ICoord[]): number {
    this.gestures[this.gestures.length] = new DrawnStroke(name, points); // append new unistroke
    let num = 0;
    for (let i = 0; i < this.gestures.length; i++) {
      if (this.gestures[i].name == name) num++;
    }
    return num;
  }
  deleteUserGestures(): number {
    this.gestures.length = this.numUnistrokes; // clear any beyond the original set
    return this.gestures.length;
  }
}

class HandWritingRecognizer {
  width: number;
  height: number;
  handwritingX: number[];
  handwritingY: number[];
  trace: number[][][];
  callback: () => {};

  constructor() {
    this.width = 0;
    this.height = 0;
    this.handwritingX = [];
    this.handwritingY = [];
    this.trace = [];
    this.callback = undefined;
  }

  assignSize(size: ISize) {
    this.width = size.width;
    this.height = size.height;
  }

  generateTrace(coords: ICoord[][]) {
    const that = this;
    this.trace = [];
    coords.forEach((stroke) => {
      that.handwritingX = [];
      that.handwritingY = [];
      stroke.forEach((point) => {
        that.handwritingX.push(point.x);
        that.handwritingY.push(point.y);
      });
      const w: number[][] = [];
      w.push(that.handwritingX);
      w.push(that.handwritingY);
      w.push([]);
      that.trace.push(w);
    });
  }

  recognize(coords: ICoord[][], callback: any) {
    this.generateTrace(coords);
    const that = this;
    const data = JSON.stringify({
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: that.width || undefined,
            writing_area_height: that.width || undefined,
          },
          ink: that.trace,
          language: "en",
        },
      ],
    });
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        switch (this.status) {
          case 200:
            const response = JSON.parse(this.responseText);
            let results;
            if (response.length === 1) {
              callback(undefined, new Error(response[0]));
            } else {
              results = response[1][0][1];
            }
            callback(results, undefined);
            break;
          case 403:
            callback(undefined, new Error("access denied"));
            break;
          case 503:
            callback(
              undefined,
              new Error("can't connect to recognition server")
            );
            break;
        }
      }
    });
    xhr.open(
      "POST",
      "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8"
    );
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
  }
}

class SketchRecognizer {
  pRecognizer: PathRecognizer;
  hwRecognizer: HandWritingRecognizer;
  constructor() {
    this.pRecognizer = new PathRecognizer();
    this.hwRecognizer = new HandWritingRecognizer();
  }
}

export const sketchRecognizer: SketchRecognizer = new SketchRecognizer();
