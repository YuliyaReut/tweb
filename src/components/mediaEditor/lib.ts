export const getRGBfromHEX = (hex: string) => {
  hex = hex.replace(/^#/, '');

  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;

  return `${r}, ${g}, ${b}`;
}

export function throttle(func: (...args: any[]) => void): (...args: any[]) => void {
  let isThrottling: boolean = false;
  let lastArgs: any[] | null = null;

  return (...args: any[]) => {
    if(!isThrottling) {
      func(...args);
      isThrottling = true;
      requestAnimationFrame(() => {
        isThrottling = false;
        if(lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      });
    } else {
      lastArgs = args;
    }
  };
}
