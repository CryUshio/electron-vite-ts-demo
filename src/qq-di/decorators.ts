import { MetadataKeys } from './typings';

/**
 * 服务装饰器
 * @type decorator
 *
 * 标记一个服务
 */
export function Service() {
  return function (target: object) {
    Reflect.defineMetadata(MetadataKeys.isService, true, target);
  };
}
