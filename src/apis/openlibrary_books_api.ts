import { Book } from '@models/book.model';
import { apiGet, BaseBooksApiImpl } from './base_api';
import { OpenLibraryBookItem, OpenLibraryBooksResponse } from './models/openlibrary_books_response';

const isbn10 = (i: string) => i.length === 10;
const isbn13 = (i: string) => i.length === 13;

function formatList(list: string[]): string {
  return list && list.length > 1 ? list.map(item => item.trim()).join(', ') : list[0] ?? '';
}

export class OpenLibraryBooksApi implements BaseBooksApiImpl {
  async getByQuery(query: string) {
    try {
      const params = {
        q: query,
        fields: 'isbn,title,subtitle,cover_i,publish_date,publisher,author_name,number_of_pages_median',
      };
      const searchResults = await apiGet<OpenLibraryBooksResponse>('https://openlibrary.org/search.json', params);
      if (!searchResults?.numFound) {
        return [];
      }
      return searchResults.docs.map(this.createBookItem);
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  // https://openlibrary.org/developers/api
  private createBookItem(item: OpenLibraryBookItem): Book {
    const date = new Date(item.publish_date[0]);
    // Open Library sometimes includes the publisher in the authors
    const authors =
      item.author_name.length > 1 ? item.author_name.filter(el => el != item.publisher[0]) : item.author_name;
    return {
      title: item.title,
      subtitle: item.subtitle,
      author: formatList(authors),
      authors,
      publisher: item.publisher[0],
      publishDate: date.toISOString().slice(0, 10),
      totalPage: item.number_of_pages_median,
      isbn: item.isbn.sort((a, b) => b.length - a.length)[0],
      ...(item.isbn.some(isbn10) && { isbn10: item.isbn.find(isbn10) }),
      ...(item.isbn.some(isbn13) && { isbn13: item.isbn.find(isbn13) }),
      ...(Object.keys(item).includes('cover_i') && {
        coverUrl: `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`,
        coverMediumUrl: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`,
        coverSmallUrl: `https://covers.openlibrary.org/b/id/${item.cover_i}-S.jpg`,
      }),
    };
  }
}
