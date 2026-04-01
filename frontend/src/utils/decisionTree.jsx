export class DecisionTreeRegressor {
  constructor(maxDepth = 5, minSamplesSplit = 2) {
    this.root = null;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  calculateMSE(y) {
    if (y.length === 0) return 0;
    const mean = y.reduce((a, b) => a + b, 0) / y.length;
    return y.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / y.length;
  }

  findBestSplit(X, y, features) {
    let bestGain = -Infinity;
    let bestFeature = '';
    let bestThreshold = 0;

    const parentMSE = this.calculateMSE(y);

    for (const feature of features) {
      const values = X.map(x => x[feature]).sort((a, b) => a - b);
      const uniqueValues = [...new Set(values)];

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

        const leftY = [];
        const rightY = [];

        for (let j = 0; j < X.length; j++) {
          if (X[j][feature] <= threshold) {
            leftY.push(y[j]);
          } else {
            rightY.push(y[j]);
          }
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const leftMSE = this.calculateMSE(leftY);
        const rightMSE = this.calculateMSE(rightY);
        const weightedMSE =
          (leftY.length * leftMSE + rightY.length * rightMSE) / y.length;
        const gain = parentMSE - weightedMSE;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }

    if (bestGain === -Infinity) return null;

    return { feature: bestFeature, threshold: bestThreshold, gain: bestGain };
  }

  buildTree(X, y, depth, features) {
    const samples = y.length;
    const meanValue = y.reduce((a, b) => a + b, 0) / y.length;

    if (
      depth >= this.maxDepth ||
      samples < this.minSamplesSplit ||
      this.calculateMSE(y) === 0
    ) {
      return { value: meanValue, samples };
    }

    const split = this.findBestSplit(X, y, features);

    if (!split) {
      return { value: meanValue, samples };
    }

    const leftX = [];
    const leftY = [];
    const rightX = [];
    const rightY = [];

    for (let i = 0; i < X.length; i++) {
      if (X[i][split.feature] <= split.threshold) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      feature: split.feature,
      threshold: split.threshold,
      left: this.buildTree(leftX, leftY, depth + 1, features),
      right: this.buildTree(rightX, rightY, depth + 1, features),
      samples,
    };
  }

  fit(X, y) {
    const features = Object.keys(X[0]);
    this.root = this.buildTree(X, y, 0, features);
  }

  predictSingle(x, node) {
    if (node.value !== undefined) {
      return node.value;
    }
    if (node.feature && node.threshold !== undefined) {
      if (x[node.feature] <= node.threshold) {
        return node.left ? this.predictSingle(x, node.left) : 0;
      } else {
        return node.right ? this.predictSingle(x, node.right) : 0;
      }
    }
    return 0;
  }

  predict(X) {
    if (!this.root) {
      throw new Error('Model not trained. Call fit() first.');
    }
    return X.map(x => this.predictSingle(x, this.root));
  }
}
