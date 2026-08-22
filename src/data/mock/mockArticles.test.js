import { describe, expect, it } from "vitest";
import { ARTICLES, ARTICLE_DB, getArticleBySlug, getArticles } from "./mockArticles";

describe("mock Intel disclosure contract", () => {
  it("marks every mock feed article as sample data without removing records", () => {
    const articles = getArticles();

    expect(articles).toHaveLength(ARTICLES.length);
    expect(articles.every(article => article.isSample === true)).toBe(true);
  });

  it("marks every mock detail article as sample data", () => {
    for (const slug of Object.keys(ARTICLE_DB)) {
      expect(getArticleBySlug(slug)?.isSample).toBe(true);
    }
  });
});
