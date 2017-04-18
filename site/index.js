import { h, render, Component } from 'preact';
import { Router, route } from 'preact-router';
import kebabCase from 'lodash.kebabcase';
import moment from 'moment';

import { timeFormat } from '../functions/formatter.js';

class Cinelah extends Component {
  constructor() {
    super()
    fetch('https://storage.googleapis.com/cinelah-92dbb.appspot.com/showtimes.json')
      .then(body => body.json())
      .then(showtimes => {
        showtimes = showtimes.map(function(showtime) {
          showtime.movieId = kebabCase(showtime.movie);
          showtime.cinemaId = kebabCase(showtime.cinema);
          return showtime;
        });
        this.setState({ showtimes });
      })
  }
  render(children, { showtimes = [] }) {
    return (
      <main>
        <nav>
          <a href="/">Home</a>
          <a href="/movies">Movies</a>
          <a href="/cinemas">Cinemas</a>
        </nav>
        <Router>
          <Home path="/" showtimes={showtimes} />
          <Movies path="/movies/" showtimes={showtimes} />
          <Movie path="/movies/:id" showtimes={showtimes} />
          <Cinemas path="/cinemas/" showtimes={showtimes} />
          <Cinema path="/cinemas/:id" showtimes={showtimes} />
        </Router>
      </main>
    );
  }
}

render(<Cinelah />, document.body);

function Home({ showtimes }) {
  return <div>Welcome</div>;
};

function Movies({ id, showtimes }) {
  const movieMap = showtimes
    .reduce(function(set, { movie, movieId }) {
      set.set(movie, { movie, movieId });
      return set;
    }, new Map());
  const movies = Array.from(movieMap.values())
    .map(function({ movie, movieId }) {
      return <div><a href={`/movies/${movieId}`}>{movie}</a></div>
    });
  return <div>{movies}</div>;
};

function Movie({ id, showtimes }) {
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
                a = moment(a.time, timeFormat).add(24, 'h').format('x');
              } else {
                a = moment(a.time, timeFormat).format('x');
              }

              if (parseInt(b.time) < 6) {
                b = moment(b.time, timeFormat).add(24, 'h').format('x');
              } else {
                b = moment(b.time, timeFormat).format('x');
              }

              if (a < b) return -1;
              if (a > b) return 1;
              return 0;
            })
            .map(function({ url, cinema, time }) {
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
};

function Cinemas({ id, showtimes }) {
  const cinemaMap = showtimes
    .reduce(function(set, { cinema, cinemaId }) {
      set.set(cinema, { cinema, cinemaId });
      return set;
    }, new Map());
  const cinemas = Array.from(cinemaMap.values())
    .sort(function(a, b) {
      a = a.cinema.toLowerCase();
      b = b.cinema.toLowerCase();
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    })
    .map(function({ cinema, cinemaId }) {
      return <div><a href={`/cinemas/${cinemaId}`}>{cinema}</a></div>
    });

  return <div>{cinemas}</div>;
};

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
                a = moment(a.time, timeFormat).add(24, 'h').format('x');
              } else {
                a = moment(a.time, timeFormat).format('x');
              }

              if (parseInt(b.time) < 6) {
                b = moment(b.time, timeFormat).add(24, 'h').format('x');
              } else {
                b = moment(b.time, timeFormat).format('x');
              }

              if (a < b) return -1;
              if (a > b) return 1;
              return 0;
            })
            .map(function({ url, time}) {
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
};
