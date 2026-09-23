import { afterEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import { fetchLists } from './apiClient';

type FetchResponse = Awaited<ReturnType<typeof globalThis.fetch>>;

const response = (body: unknown, status: number): FetchResponse =>
  new globalThis.Response(JSON.stringify(body), { status });

describe('apiClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads server lists and joins normalized items by listId', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      response(
        {
          success: true,
          data: {
            lists: [
              {
                id: 'list-1',
                title: 'Market',
                description: null,
                type: 'SHOPPING',
                isShared: true,
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            items: [
              {
                id: 'item-1',
                listId: 'list-1',
                title: 'Süt',
                quantity: 2,
                isCompleted: false,
                isPinned: false,
                priority: 'MEDIUM',
              },
            ],
          },
        },
        200,
      ),
    );

    await expect(fetchLists()).resolves.toEqual([
      expect.objectContaining({
        id: 'list-1',
        description: '',
        items: [expect.objectContaining({ id: 'item-1', quantity: 2 })],
      }),
    ]);
  });

  it('surfaces HTTP errors instead of returning mock data', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response({ success: false, error: 'Database unavailable' }, 503));

    await expect(fetchLists()).rejects.toThrow('Database unavailable');
  });

  it('surfaces network failures unchanged', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));

    await expect(fetchLists()).rejects.toThrow('Network request failed for');
  });

  it('reports malformed server responses', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new globalThis.Response('not-json', { status: 200 }));

    await expect(fetchLists()).rejects.toThrow('Invalid API response');
  });
});
