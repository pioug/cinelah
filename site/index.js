import { h, render, Component } from 'preact';
import { Router } from 'preact-router';
import isAfter from 'date-fns/is_after';
import addDays from 'date-fns/add_days';

import './style.scss';

const BUCKET = 'https://storage.googleapis.com/cinelah-92dbb.appspot.com';

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
            return Object.assign({}, showtime,
              {
                movie: movies[showtime.movie].title,
                movieId: showtime.movie,
                cinema: cinemas[showtime.cinema].name,
                cinemaId: showtime.cinema
              });
          });
        this.setState({ cinemas, movies, showtimes });
      });
  }
  render(children, { showtimes = [], cinemas = {}, movies = {} }) {
    return (
      <main>
        <nav>
          <a href="/movies">Movies</a>
          <a href="/cinemas">Cinemas</a>
        </nav>
        <Router>
          <Movies path="/" movies={movies} />
          <Movies path="/movies/" movies={movies} />
          <Movie path="/movies/:id" showtimes={showtimes} />
          <Cinemas path="/cinemas/" cinemas={cinemas} />
          <Cinema path="/cinemas/:id" showtimes={showtimes} />
        </Router>
      </main>
    );
  }
}

render(<Cinelah />, document.body);

function Movies({ movies }) {
  const moviesEls = Object.keys(movies)
    .map(function(id) {
      return {
        id: id,
        title: movies[id].title
      };
    })
    .map(function({ id, title }) {
      const style = {
        backgroundImage: `url(${BUCKET}/movies/${id}/backdrop.jpg)`
      };
      return (
        <a href={`/movies/${id}`} class="movie-tile" style={style}>
          <h2>{title}</h2>
        </a>
      );
    });

  return <div class="movies">{moviesEls}</div>;
}

function Movie({ id, showtimes }) {
  console.log(id, showtimes);
  const movieShowtimes = showtimes
    .filter(function({ movieId }) {
      return id === movieId;
    })
    .reduce(function(res, showtime) {
      const date = res.get(showtime.date) || { date: showtime.date, showtimes: [] };
      date.showtimes.push(showtime);
      res.set(showtime.date, date);
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
          const cinema = res.get(showtime.cinema) || { cinema: showtime.cinema, showtimes: [] };
          cinema.showtimes.push(showtime);
          res.set(showtime.cinema, cinema);
          return res;
        }, new Map());

      const list = Array.from(showtimesByCinema.keys())
        .map(function(cinema) {
          const { showtimes } = showtimesByCinema.get(cinema);
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
            .map(function({ url, time }) {
              return <div><a href={url}>{time}</a></div>;
            });
          return (
            <article>
              <h1>{cinema}</h1>
              <div>{showtimesByCinemaEls}</div>
            </article>
          );
        });
      return (
        <article>
          <h1>{date}</h1>
          <article>{list}</article>
        </article>
      );
    });
  return <div>{list}</div>;
}

function Cinemas({ cinemas = {} }) {
  const cinemaEls = Object.keys(cinemas)
    .map(function(id) {
      return {
        id: id,
        name: cinemas[id].name
      };
    })
    .sort(function(a, b) {
      a = a.name.toLowerCase();
      b = b.name.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(function({ id, name }) {
      return <div><a href={`/cinemas/${id}`}>{name}</a></div>;
    });

  return <div>{cinemaEls}</div>;
}

function Cinema({ id, showtimes }) {
  const cinemaShowtimes = showtimes
    .filter(function({ cinemaId }) {
      return id === cinemaId;
    })
    .reduce(function(res, showtime) {
      const date = res.get(showtime.date) || { date: showtime.date, showtimes: [] };
      date.showtimes.push(showtime);
      res.set(showtime.date, date);
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
          const movie = res.get(showtime.movie) || { movie: showtime.movie, showtimes: [] };
          movie.showtimes.push(showtime);
          res.set(showtime.movie, movie);
          return res;
        }, new Map());

      const list = Array.from(showtimesByMovie.keys())
        .map(function(movie) {
          const { showtimes } = showtimesByMovie.get(movie);
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
            .map(function({ url, time }) {
              return <div><a href={url}>{time}</a></div>;
            });
          return (
            <article>
              <h1>{movie}</h1>
              <div>{showtimesByCinemaEls}</div>
            </article>
          );
        });
      return (
        <article>
          <h1>{date}</h1>
          <article>{list}</article>
        </article>
      );
    });
  return <div>{list}</div>;
}
