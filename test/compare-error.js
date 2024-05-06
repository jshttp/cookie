function compareError(errorProperties) {
  return function (error) {
    if (
      error instanceof Error &&
      error.message === errorProperties.message &&
      error.code === errorProperties.code
    ) {
      return true;
    }
  };
}

module.exports = compareError;
