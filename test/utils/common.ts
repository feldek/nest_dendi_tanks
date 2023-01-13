export const freezeTime = (delay: number) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(''), delay);
  });
