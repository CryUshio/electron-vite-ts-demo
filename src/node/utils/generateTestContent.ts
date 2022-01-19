const SIZE_1K = '0'.repeat(1000);

/**
 * @param size 单位 kb
 */
export default (size: number): string => {
  return SIZE_1K.repeat(size);
};
