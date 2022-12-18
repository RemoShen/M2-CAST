export const COMPONENT: string = "component";

export let FeatureNames: { [key: string]: string | number };
((FeatureNames: { [key: string]: string | number }) => {
  FeatureNames[FeatureNames[COMPONENT]] = 1;
})((FeatureNames = {}));

const _debugEnabledFeatures: number[] = [];
/**
 * Enables or disabled debug console messages for the specified MIL feature, or returns whether logging for the specified feature is enabled.
 * Note: All "general" logging (ie. that is NOT feature-specific) done by MIL can be turned off with this command: MIL.DebugFeature(MIL.FeatureNames.MIL, false);
 * @param {FeatureNames} featureNames One-or-more MIL.FeatureNames value (eg. MIL.FeatureNames.MIL | MIL.FeatureNames.GestureRecognition).
 * @param {boolean} [enable] [Optional] Whether to turn debug messages on or off. If not supplied, the method with return whether logging for the specified feature(s) is enabled.
 * @returns {boolean | void} Result.
 */
const DebugFeature = (featureName: number, enable?: boolean) => {
  var validMask = 0;
  var validFeatureNames = [];
  var suppliedFeatureNames = [];
  // Build validMask and populate suppliedFeatureNames
  for (var propName in FeatureNames) {
    if (isNaN(+propName)) {
      validFeatureNames.push(propName);
    } else {
      var enumValue = +propName;
      validMask |= enumValue;
      if (featureName & enumValue && enumValue !== FeatureNames.Default) {
        suppliedFeatureNames.push(FeatureNames[enumValue]);
      }
    }
  }
  // Check featureNames
  var isValidFeatures =
    featureName > 0 && (featureName & validMask) <= validMask;
  if (!isValidFeatures) {
    console.error(
      "Invalid featureNames (" +
        featureName +
        "); valid values are: " +
        validFeatureNames.join(", ")
    );
  }
  if (enable === undefined) {
    // Check if ALL the supplied featureNames are enabled
    var result_1 = suppliedFeatureNames.length > 0;
    suppliedFeatureNames.forEach((featureName) => {
      if (_debugEnabledFeatures.indexOf(<number>featureName) === -1) {
        result_1 = false;
      }
    });
    return result_1;
  } else {
    // Enable/disable the supplied featureNames
    suppliedFeatureNames.forEach(function (featureName) {
      if (enable) {
        if (_debugEnabledFeatures.indexOf(<number>featureName) === -1) {
          _debugEnabledFeatures.push(<number>featureName);
        }
      } else {
        var index = _debugEnabledFeatures.indexOf(<number>featureName);
        if (index !== -1) {
          _debugEnabledFeatures.splice(index, 1);
        }
      }
    });
  }
};

export const log = (message: string, featureName?: number) => {
  if (featureName === void 0) {
    featureName = <number>FeatureNames[COMPONENT];
  }
  if (!DebugFeature(featureName)) {
    return;
  }
};

function getTime(): string {
  let now = new Date(Date.now());
  let date =
    ("0" + (now.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + now.getDate()).slice(-2);
  let time =
    ("0" + now.getHours()).slice(-2) +
    ":" +
    ("0" + now.getMinutes()).slice(-2) +
    ":" +
    ("0" + now.getSeconds()).slice(-2) +
    "." +
    ("00" + now.getMilliseconds()).slice(-3);
  return date + " " + time;
}
