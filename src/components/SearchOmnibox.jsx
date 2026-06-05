import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { parseReferenceTrackUrl } from "../utils/referenceTrackUtils";
import { SearchIcon } from "./AppIcons";

const { useEffect, useState } = React;

function getInitialSearchValue(searchParams) {
  return searchParams.get("url") || searchParams.get("q") || "";
}

export default function SearchOmnibox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(() => getInitialSearchValue(searchParams));
  const trimmedValue = value.trim();

  useEffect(() => {
    setValue(getInitialSearchValue(searchParams));
  }, [searchParams]);

  function handleSubmit(event) {
    event.preventDefault();

    if (!trimmedValue) return;

    const parsedReference = parseReferenceTrackUrl(trimmedValue);
    const searchKey = parsedReference.isValid && !parsedReference.isEmpty ? "url" : "q";

    navigate(`/search?${searchKey}=${encodeURIComponent(trimmedValue)}`);
  }

  return (
    <form className="dashboard-search-omnibox" role="search" onSubmit={handleSubmit}>
      <input
        id="dashboard-song-search"
        type="search"
        value={value}
        placeholder="Search song, artist, or paste a link"
        autoComplete="off"
        aria-label="Search song, artist, or paste a link"
        onChange={(event) => setValue(event.target.value)}
      />

      <button
        type="submit"
        className="dashboard-search-submit-button"
        aria-label="Search"
        title="Search"
        disabled={!trimmedValue}
      >
        <SearchIcon />
      </button>
    </form>
  );
}
