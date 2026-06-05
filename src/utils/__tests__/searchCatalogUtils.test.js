import { describe, expect, it } from "vitest";
import { getArtistById, getPaginatedItems, searchArtists, searchSongs } from "../searchCatalogUtils";

const SONGS = [
  {
    artist: "Chris Tomlin",
    genre: "Worship",
    id: "good-good-father",
    title: "Good Good Father",
  },
  {
    artist: "Chris Tomlin",
    genre: "Worship",
    id: "how-great-is-our-god",
    title: "How Great Is Our God",
  },
  {
    artist: "Snoh Aalegra",
    genre: "R&B",
    id: "i-want-you-around",
    title: "I Want You Around",
  },
];

describe("searchCatalogUtils", () => {
  it("searches artists", () => {
    const artists = searchArtists("chris", SONGS);

    expect(artists).toHaveLength(1);
    expect(artists[0].name).toBe("Chris Tomlin");
    expect(artists[0].songCount).toBe(2);
  });

  it("searches songs by title and artist", () => {
    expect(searchSongs("good father", SONGS)[0].title).toBe("Good Good Father");
    expect(searchSongs("snoh", SONGS)[0].title).toBe("I Want You Around");
  });

  it("finds an artist by id", () => {
    const artist = getArtistById("chris-tomlin", SONGS);

    expect(artist.name).toBe("Chris Tomlin");
    expect(artist.songs).toHaveLength(2);
  });

  it("paginates artist songs", () => {
    const items = Array.from({ length: 45 }, (_, index) => ({ id: index }));

    const page = getPaginatedItems(items, 2, 20);

    expect(page.items).toHaveLength(20);
    expect(page.currentPage).toBe(2);
    expect(page.totalPages).toBe(3);
  });
});
