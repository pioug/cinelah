import addDays from 'date-fns/add_days';
import format from 'date-fns/format';
import haversine from 'haversine';
import isAfter from 'date-fns/is_after';
import isToday from 'date-fns/is_today';
import isTomorrow from 'date-fns/is_tomorrow';
import Match from 'preact-router/match';
import Router from 'preact-router';
import { h, render, Component } from 'preact';

import './style.scss';
import './favicon.png';
import './icon512.png';
import './open-graph.png';

const BUCKET = 'https://storage.googleapis.com/cinelah-92dbb.appspot.com';

const scrollTop = {};
const pushState = history.pushState;

history.pushState = function(a, b, url) {
  pushState.call(history, a, b, url);

  if (url.indexOf('#') < 0) {
    scrollTo(0, 0);
  }

  trackPageView();
};

window.onpopstate = function() {
  setTimeout(function() {
    document.body.scrollTop = scrollTop[location.pathname] || 0;
    trackPageView();
  });
};

window.addEventListener('scroll', function() {
  scrollTop[location.pathname] = document.body.scrollTop;
}, { passive: true });

class Cinelah extends Component {
  componentDidMount() {
    fetch(`${BUCKET}/showtimes.json`)
      .then(body => body.json())
      .then(({ cinemas, movies, showtimes }) => {
        const now = new Date();
        showtimes = showtimes
          .filter(function({ date, time }) {
            return isAfter(`${date} ${time}`, now);
          })
          .map(function(showtime) {
            return Object.assign(showtime, {
              movie: movies[showtime.movie].title,
              movieId: showtime.movie,
              cinema: cinemas[showtime.cinema].name,
              cinemaId: showtime.cinema,
              rating: movies[showtime.movie].rating,
              genre: movies[showtime.movie].genre,
              country: movies[showtime.movie].country
            });
          });

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(position => {
            Object.keys(cinemas)
              .map(function(cinemaId) {
                cinemas[cinemaId].distance = Math.round(haversine({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }, {
                  latitude: cinemas[cinemaId].coordinates[0],
                  longitude: cinemas[cinemaId].coordinates[1]
                }));

                return cinemas[cinemaId];
              });

            this.setState({ cinemas });
          }, function(error) {
            console.error(error);
          }, {
            enableHighAccuracy: true
          });
        }

        this.setState({ cinemas, movies, showtimes });
      });
  }
  render(children, { showtimes = [], cinemas = {}, movies = {} }) {
    return (
      <main>
        <Match>{renderHeader}</Match>
        <Router>
          <Movies default path="/movies/" movies={movies} />
          <Movie path="/movies/:id" movies={movies} showtimes={showtimes} cinemas={cinemas} />
          <Cinemas path="/cinemas/" cinemas={cinemas} />
          <Cinema path="/cinemas/:id" cinemas={cinemas} showtimes={showtimes} />
        </Router>
      </main>
    );

    function renderHeader({ path }) {
      const title = getTitle(path);
      document.title = title ? `Cinelah: ${title}` : 'Cinelah';

      return (
        <header>
          <div><a href={getParentHref(path)}>{title || 'Cinelah'}</a></div>
          <div>
            <a href="/movies" class={path.includes('/movies') || path === '/' ? 'active' : ''} aria-label="Go to Now Showing">
              <svg aria-hidden="true" fill="#000000" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
                <path d="M0 0h24v24H0z" fill="none"/>
              </svg>
            </a>
            <a href="/cinemas" class={path.includes('/cinemas') ? 'active' : ''} aria-label="Go to Movie Theaters">
              <svg aria-hidden="true" fill="#000000" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                <path d="M0 0h24v24H0z" fill="none"/>
              </svg>
            </a>
          </div>
        </header>
      );

      function getTitle(url) {
        const id = url.split('/').pop();

        switch (true) {
          case id && /movies\/+/gi.test(url):
            return movies[id] && movies[id].title;
          case id && /cinemas\/+/gi.test(url):
            return cinemas[id] && cinemas[id].name;
          default:
            return '';
        }
      }

      function getParentHref(url) {
        const id = url.split('/').pop();

        switch (true) {
          case id && /movies\/+/gi.test(url):
            return movies[id] && movies[id].title && '/movies/';
          case id && /cinemas\/+/gi.test(url):
            return cinemas[id] && cinemas[id].name && '/cinemas/';
          default:
            return '/';
        }
      }
    }
  }
}

document.body.querySelector('main').remove();
render(<Cinelah />, document.body);
trackPageView();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

function Movies({ movies }) {
  const moviesEls = Object.keys(movies)
    .map(function(id) {
      const { title, rating, genre, country } = movies[id];
      const style = {
        backgroundImage: `url(${BUCKET}/movies/${id}/backdrop.jpg)`
      };
      return (
        <a href={`/movies/${id}`} class="movie-tile">
          <div class="movie-tile-poster" style={style}></div>
          <div class="movie-tile-description">
            <div class="movie-tile-description-title">{title}</div>
            <div class="movie-tile-description-subtitle">
              {!!rating && <div class="movie-tile-description-rating">
                <svg class="icon-star" fill="#FFFFFF" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  <path d="M0 0h24v24H0z" fill="none"/>
                </svg>
                {rating}
              </div>}
              {!!genre && <div class="movie-tile-description-rating">
                {genre}
              </div>}
              {!!country && <div class="movie-tile-description-rating">
                {country}
              </div>}
            </div>
          </div>
        </a>
      );
    });

  if (moviesEls.length) {
    return (
      <div class="movies">
        <h1>Now Showing</h1>
        {moviesEls}
      </div>
    );
  }

  const placeholder =
    <a class="movie-tile">
      <div class="movie-tile-poster"></div>
      <div class="movie-tile-description">
        <div class="movie-tile-description-title placeholder"></div>
        <div class="movie-tile-description-subtitle">
          <div class="movie-tile-description-rating placeholder"></div>
        </div>
      </div>
    </a>;

  return (
    <div class="movies">
      <h1>Now Showing</h1>
      {Array(20).fill(placeholder)}
    </div>
  );
}

function Movie({ id, movies, cinemas, showtimes }) {
  const movieShowtimes = showtimes
    .filter(function({ movieId }) {
      return id === movieId;
    })
    .reduce(function(res, showtime) {
      const showtimeDay = parseInt(showtime.time) < 6 ?
        format(addDays(showtime.date, -1), 'YYYY-MM-DD') :
        showtime.date;
      const date = res.get(showtimeDay) || { date: showtimeDay, showtimes: [] };
      date.showtimes.push(showtime);
      res.set(showtimeDay, date);
      return res;
    }, new Map());

  const list = Array.from(movieShowtimes.keys())
    .sort(function(a, b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(function(date) {
      const { showtimes } = movieShowtimes.get(date);
      const showtimesByCinema = showtimes
        .reduce(function(res, showtime) {
          const cinema = res.get(showtime.cinemaId) || { cinema: showtime.cinemaId, showtimes: [] };
          cinema.showtimes.push(showtime);
          res.set(showtime.cinemaId, cinema);
          return res;
        }, new Map());

      const list = Array.from(showtimesByCinema.keys())
        .sort(function(a, b) {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        })
        .map(function(cinemaId) {
          const { showtimes } = showtimesByCinema.get(cinemaId);
          const showtimesByCinemaEls = showtimes
            .sort(function(a, b) {
              if (parseInt(a.time) < 6) {
                a = addDays(`${a.date} ${a.time}`, 1);
              } else {
                a = addDays(`${a.date} ${a.time}`, 0);
              }

              if (parseInt(b.time) < 6) {
                b = addDays(`${b.date} ${b.time}`, 1);
              } else {
                b = addDays(`${b.date} ${b.time}`, 0);
              }

              if (isAfter(b, a)) return -1;
              if (isAfter(a, b)) return 1;
              return 0;
            })
            .map(function(showtime) {
              return <Time showtime={showtime} />;
            });
          const [group, name] = cinemas[cinemaId].name.split(' - ');
          return (
            <article class="cinema-times">
              <div class="cinema-tile">
                <div class="cinema-tile-description-column-1" style="min-height: auto; padding-top: 0;">
                  <a href={`/cinemas/${cinemaId}`} class={`cinema-tile-description-group ${group.toLowerCase()}`}>{group}</a>
                </div>
                <div class="cinema-tile-description">
                  <div class="cinema-tile-description-title" style="margin-bottom: 0">{name}</div>
                </div>
              </div>
              <div class="times">{showtimesByCinemaEls}</div>
            </article>
          );
        });
      return (
        <article>
          <h1>{displayDate(date)}</h1>
          <article>{list}</article>
        </article>
      );
    });

  if (list.length || !Object.keys(movies).length) {
    return (
      <div>
        <MovieHeader movie={movies[id]}></MovieHeader>
        {list}
      </div>
    );
  }

  if (movies[id]) {
    return (
      <article>
        <MovieHeader movie={movies[id]}></MovieHeader>
        <h1 class="error">No timing found</h1>
        <section>
          <p>Go back to <a href="/movies">Now Showing</a>.</p>
        </section>
      </article>
    );
  }

  return (
    <article>
      <h1 class="error">Movie not found</h1>
      <section>
        <p>Go back to <a href="/movies">Now Showing</a>.</p>
      </section>
    </article>
  );
}

function MovieHeader({ movie = {} }) {
  if (!movie.id) {
    return (
      <div class="movie-header">
        <div class="movie-header-poster-container"></div>
        <dl>
          <dt>Summary</dt>
          <dd class="placeholder large"></dd>
          <dd class="placeholder medium"></dd>
          <div style="display: flex; margin-top: 12px">
            <div style="margin-right: 16px">
              <dt>Rating</dt>
              <dd class="placeholder"></dd>
            </div>
            <div style="margin-right: 16px">
              <dt>Country</dt>
              <dd class="placeholder"></dd>
            </div>
            <div style="flex: 1">
              <dt>Genre</dt>
              <dd class="placeholder"></dd>
            </div>
          </div>
        </dl>
      </div>
    );
  }

  const style = {
    backgroundImage: `url(${BUCKET}/movies/${movie.id}/poster.jpg)`
  };

  return (
    <div class="movie-header" style={style}>
      <div class="movie-header-poster-container">
        <img src={`${BUCKET}/movies/${movie.id}/poster.jpg`} alt={`${movie.title} poster`}/>
      </div>
      <dl>
        {movie.summary && <dt>Summary</dt>}
        {movie.summary && <dd>{movie.summary}</dd>}
        <div style="display: flex; margin-top: 12px">
          {movie.rating && <div style="margin-right: 16px">
            <dt>Rating</dt>
            <dd>{movie.rating}</dd>
          </div>}
          {movie.country && <div style="margin-right: 16px">
            <dt>Country</dt>
            <dd>{movie.country}</dd>
          </div>}
          {movie.genre && <div style="flex: 1">
            <dt>Genre</dt>
            <dd>{movie.genre}</dd>
          </div>}
        </div>
      </dl>
    </div>
  );
}

function Cinemas({ cinemas = {} }) {
  const cinemaEls = Object.keys(cinemas)
    .map(function(id) {
      const distance = cinemas[id].distance;
      const [group, name] = cinemas[id].name.split(' - ');
      return {
        id: id,
        group,
        name,
        distance,
      };
    })
    .sort(function(a, b) {
      a = a.group.toLowerCase() + a.name.toLowerCase();
      b = b.group.toLowerCase() + b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(function({ id, group, name, distance }) {
      return (
        <a class="cinema-tile" href={`/cinemas/${id}`}>
          <div class="cinema-tile-description-column-1">
            <div class="cinema-tile-description-group" class={`cinema-tile-description-group ${group.toLowerCase()}`}>{group}</div>
          </div>
          <div class="cinema-tile-description">
            <div class="cinema-tile-description-title">{name}</div>
            <div class="cinema-tile-description-subtitle">
              {!!distance && <div class="cinema-tile-description-rating">
                {distance} km
              </div> || <div class="cinema-tile-description-rating placeholder"></div>}
            </div>
          </div>
        </a>
      );
    });

  return (
    <div class="cinemas">
      <h1>Movie Theaters</h1>
      {cinemaEls}
    </div>
  );
}

function Cinema({ cinemas, id, showtimes }) {
  const cinemaShowtimes = showtimes
    .filter(function({ cinemaId }) {
      return id === cinemaId;
    })
    .reduce(function(res, showtime) {
      const showtimeDay = parseInt(showtime.time) < 6 ?
        format(addDays(showtime.date, -1), 'YYYY-MM-DD') :
        showtime.date;
      const date = res.get(showtimeDay) || { date: showtimeDay, showtimes: [] };
      date.showtimes.push(showtime);
      res.set(showtimeDay, date);
      return res;
    }, new Map());

  const list = Array.from(cinemaShowtimes.keys())
    .sort(function(a, b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(function(date) {
      const { showtimes } = cinemaShowtimes.get(date);
      const showtimesByMovie = showtimes
        .reduce(function(res, showtime) {
          const movie = res.get(showtime.movie) || { movie: showtime.movie, movieId: showtime.movieId, rating: showtime.rating, country: showtime.country, genre: showtime.genre, showtimes: [] };

          movie.showtimes.push(showtime);
          res.set(showtime.movie, movie);
          return res;
        }, new Map());

      const list = Array.from(showtimesByMovie.keys())
        .map(function(movie) {
          const { showtimes, movieId, rating, genre, country } = showtimesByMovie.get(movie);
          const showtimesByCinemaEls = showtimes
            .sort(function(a, b) {
              if (parseInt(a.time) < 6) {
                a = addDays(`${a.date} ${a.time}`, 1);
              } else {
                a = addDays(`${a.date} ${a.time}`, 0);
              }

              if (parseInt(b.time) < 6) {
                b = addDays(`${b.date} ${b.time}`, 1);
              } else {
                b = addDays(`${b.date} ${b.time}`, 0);
              }

              if (isAfter(b, a)) return -1;
              if (isAfter(a, b)) return 1;
              return 0;
            })
            .map(function(showtime) {
              return <Time showtime={showtime} />;
            });

          const style = {
            backgroundImage: `url(${BUCKET}/movies/${movieId}/backdrop.jpg)`
          };

          return (
            <article class="movie-times">
              <div class="movie-tile">
                <a href={`/movies/${movieId}`} class="movie-tile-poster" style={style}></a>
                <div class="movie-tile-description">
                  <div class="movie-tile-description-title">{movie}</div>
                  <div class="movie-tile-description-subtitle">
                    {!!rating && <div class="movie-tile-description-rating">
                      <svg class="icon-star" fill="#FFFFFF" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        <path d="M0 0h24v24H0z" fill="none"/>
                      </svg>
                      {rating}
                    </div>}
                    {!!genre && <div class="movie-tile-description-rating">
                      {genre}
                    </div>}
                    {!!country && <div class="movie-tile-description-rating">
                      {country}
                    </div>}
                  </div>
                </div>
              </div>
              <div class="times">{showtimesByCinemaEls}</div>
            </article>
          );
        });
      return (
        <article>
          <h1>{displayDate(date)}</h1>
          <article>{list}</article>
        </article>
      );
    });

  if (list.length || !Object.keys(cinemas).length) {
    return <div>{list}</div>;
  }

  if (cinemas[id]) {
    return (
      <article>
        <h1 class="error">No timing found</h1>
        <section>
          <p>Go back to <a href="/cinemas">Movie Theaters</a>.</p>
        </section>
      </article>
    );
  }

  return (
    <article>
      <h1 class="error">Cinema not found</h1>
      <section>
        <p>Go back to <a href="/cinemas">Movie Theaters</a>.</p>
      </section>
    </article>
  );
}

function Time({ showtime = {} }) {
  return <a class="time" target="_blank" rel="noopener" href={showtime.url}>{showtime.time}</a>;
}

function displayDate(date) {
  if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else {
    return format(date, 'dddd D MMM');
  }
}

function trackPageView() {
  if (PRODUCTION) {
    ga('set', 'page', location.pathname);
    ga('send', 'pageview');
  }
}
