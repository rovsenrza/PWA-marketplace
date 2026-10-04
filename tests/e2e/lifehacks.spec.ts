import { test, expect } from './fixtures';

test('lifehacks: a vote and «это сработало» survive a reload; the demo totals as before', async ({ app }) => {
  const poll = await app.evaluate(() => {
    const item = (eval('lifehacksDb') as any[]).find((x) => x.poll?.options?.length);
    return { id: item.id, pollId: item.poll.id, opt: item.poll.options[0].id };
  });
  expect(await app.evaluate((p) => eval('lhPollCounts')[p], poll.pollId)).toBeTruthy(); // демо-итоги на месте
  const before = await app.evaluate((id) => eval('lhUsefulCounts')[id] ?? 0, poll.id);
  await app.evaluate((p) => { (window as any).voteLifehackPoll(p.pollId, p.opt); (window as any).toggleLhUseful(p.id); }, poll);
  await app.reload();
  await app.waitForFunction(() => typeof (window as any).switchTab === 'function');
  await app.waitForLoadState('load');
  expect(await app.evaluate((p) => eval('lhPollVotes')[p], poll.pollId)).toBe(poll.opt);
  expect(await app.evaluate((id) => eval('lhUsefulMine')[id], poll.id)).toBe(true);
  expect(await app.evaluate((id) => eval('lhUsefulCounts')[id], poll.id)).toBe(before + 1);
  await app.evaluate((id) => { (window as any).switchTab('directory'); (window as any).switchDirectoryView('lifehacks'); (window as any).openLifehackArticle(id); }, poll.id);
  await expect(app.locator('#lh-article-react')).toContainText('Сработало для вас');
});
