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
        fields: 'isbn,title,subtitle,publish_date,publisher,author_name,number_of_pages_median',
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

  private createBookItem(item: OpenLibraryBookItem): Book {
    return {
      title: item.title,
      subtitle: item.subtitle,
      author: formatList(item.author_name),
      authors: item.author_name,
      publisher: item.publisher[0],
      publishDate: item.publish_date[0],
      totalPage: item.number_of_pages_median,
      isbn: item.isbn.sort((a, b) => b.length - a.length)[0],
      ...(item.isbn.some(isbn10) && { isbn10: item.isbn.find(isbn10) }),
      ...(item.isbn.some(isbn13) && { isbn13: item.isbn.find(isbn13) }),
    };
  }
}
