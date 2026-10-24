import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRecipe, getMethod, formatGrams } from '../recipe.js';

const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-8, `${a} !== ${b}`);

test('original 697g formula', () => {
  const r=calculateRecipe();
  close(r.totalDough,697); close(r.flour,400); close(r.water,286);
  close(r.salt,7); close(r.yeast,4); close(r.hydrationPct,71.5);
  close(r.parts.tangzhong.flour,60); close(r.parts.tangzhong.water,120);
  close(r.parts.poolish.flour,80); close(r.parts.poolish.water,80); close(r.parts.poolish.yeast,0.8);
  close(r.parts.final.flour,260); close(r.parts.final.water,86); close(r.parts.final.yeast,3.2);
});

test('scales bread batches', () => {
  const r=calculateRecipe({count:2,pieceWeight:697});
  close(r.totalDough,1394);close(r.flour,800);
});

test('same day pizza preserves formula', () => {
  const r=calculateRecipe({mode:'pizza',count:3,pieceWeight:260});
  close(r.totalDough,780);close(r.yeastPct,1);
});

test('overnight pizza reduces yeast', () => {
  const r=calculateRecipe({mode:'pizza',profile:'overnight',count:4,pieceWeight:250});
  close(r.totalDough,1000);close(r.parts.final.yeast,0);close(r.yeastPct,0.2);
});

test('bread ignores pizza-only overnight profile', () => {
  const r=calculateRecipe({mode:'bread',profile:'overnight'});
  close(r.totalDough,697);close(r.yeastPct,1);
});

test('bread and pizza methods differ', () => {
  const bread=getMethod({mode:'bread'}).map(s=>s.id);
  const pizza=getMethod({mode:'pizza'}).map(s=>s.id);
  assert.ok(bread.includes('bake1'));assert.ok(pizza.includes('stretch'));
});

test('pizza pan method exists', () => {
  const pan=getMethod({mode:'pizza',pizzaStyle:'pan'}).map(s=>s.id);
  assert.ok(pan.includes('press'));assert.ok(!pan.includes('stretch'));
});

test('input validation and formatting', () => {
  assert.throws(()=>calculateRecipe({count:0}),RangeError);
  assert.throws(()=>calculateRecipe({pieceWeight:10}),RangeError);
  assert.equal(formatGrams(7),'7 g');
});
