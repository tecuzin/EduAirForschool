import { assign } from '../utils/obj.js';
import toTitleCase from '../utils/to-title-case.js';

const middlewares = {};

export const TERMINATOR = {};

export function use(type, middleware) {
  middlewares[type] = middlewares[type] || [];
  middlewares[type].push(middleware);
}

export function getMiddleware(type) {
  if (type) {
    return middlewares[type];
  }

  return middlewares;
}

export function setSource(player, src, next) {
  player.setTimeout(() => setSourceHelper(src, middlewares[src.type], next, player), 1);
}

export function setTech(middleware, tech) {
  middleware.forEach((mw) => mw.setTech && mw.setTech(tech));
}

/**
 * Calls a getter on the tech first, through each middleware
 * from right to left to the player.
 */
export function get(middleware, tech, method) {
  return middleware.reduceRight(middlewareIterator(method), tech[method]());
}

/**
 * Takes the argument given to the player and calls the setter method on each
 * middlware from left to right to the tech.
 */
export function set(middleware, tech, method, arg) {
  return tech[method](middleware.reduce(middlewareIterator(method), arg));
}

/**
 * Takes the argument given to the player and calls the `call` version of the method
 * on each middleware from left to right.
 * Then, call the passed in method on the tech and return the result unchanged
 * back to the player, through middleware, this time from right to left.
 */
export function mediate(middleware, tech, method, arg = null) {
  const callMethod = 'call' + toTitleCase(method);
  const middlewareValue = middleware.reduce(middlewareIterator(callMethod), arg);
  const terminated = middlewareValue === TERMINATOR;
  const returnValue = terminated ? null : tech[method](middlewareValue);

  executeRight(middleware, method, returnValue, terminated);

  return returnValue;
}

export const allowedGetters = {
  buffered: 1,
  currentTime: 1,
  duration: 1,
  seekable: 1,
  played: 1,
  paused: 1
};

export const allowedSetters = {
  setCurrentTime: 1
};

export const allowedMediators = {
  play: 1,
  pause: 1
};

function middlewareIterator(method) {
  return (value, mw) => {
    // if the previous middleware terminated, pass along the termination
    if (value === TERMINATOR) {
      return TERMINATOR;
    }

    if (mw[method]) {
      return mw[method](value);
    }

    return value;
  };
}

function executeRight(mws, method, value, terminated) {
  for (let i = mws.length - 1; i >= 0; i--) {
    const mw = mws[i];

    if (mw[method]) {
      mw[method](terminated, value);
    }
  }
}

function setSourceHelper(src = {}, middleware = [], next, player, acc = [], lastRun = false) {
  const [mwFactory, ...mwrest] = middleware;

  // if mwFactory is a string, then we're at a fork in the road
  if (typeof mwFactory === 'string') {
    setSourceHelper(src, middlewares[mwFactory], next, player, acc, lastRun);

  // if we have an mwFactory, call it with the player to get the mw,
  // then call the mw's setSource method
  } else if (mwFactory) {
    const mw = mwFactory(player);

    mw.setSource(assign({}, src), function(err, _src) {

      // something happened, try the next middleware on the current level
      // make sure to use the old src
      if (err) {
        return setSourceHelper(src, mwrest, next, player, acc, lastRun);
      }

      // we've succeeded, now we need to go deeper
      acc.push(mw);

      // if it's the same type, continue down the current chain
      // otherwise, we want to go down the new chain
      setSourceHelper(_src,
          src.type === _src.type ? mwrest : middlewares[_src.type],
          next,
          player,
          acc,
          lastRun);
    });
  } else if (mwrest.length) {
    setSourceHelper(src, mwrest, next, player, acc, lastRun);
  } else if (lastRun) {
    next(src, acc);
  } else {
    setSourceHelper(src, middlewares['*'], next, player, acc, true);
  }
}
