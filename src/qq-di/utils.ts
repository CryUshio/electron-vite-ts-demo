export function getPropertyCacheMetadataKey(propertyName: string | symbol) {
  return `qq-di_cache_key__${propertyName.toString()}`;
}
