import './App.css'
import React from 'react'
import {useEffect, useState} from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx';
import MovieCard from './components/MovieCard.jsx';
import { useDebounce } from 'react-use';
import { getTrendingMovies, updateSearchCount } from './appwrite.js'


const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  const [searchTerm , setSearchTerm] = useState('');
  const [errorMessage , setErrorMessage] = useState('');
  const [movieList , setMovieList] = useState([]); //state to store the movies
  const [isLoading, setIsLoading] = useState(false); //state for loading screen
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [trendingMovies , setTrendingMovies] = useState([]);

  //how lomg it should wait before changing the value
  //debounce is the search term that prevent you from making too much API request
  //by waiting for the user to stop typing for 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);


  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');




    try {
      const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`; //to get the most popular movies
      const response = await fetch(endpoint, API_OPTIONS); //to fetch data from the API
      

      if(!response.ok)
      {
        throw new Error('Failed to fetch movies data from the API');
      }

      const data = await response.json(); 
      console.log(data);//to see the data in the console (might remove later)
      
      if(data.Response === 'False')
      {
        setErrorMessage(data.Error|| 'Failed to fetch movies from API');
        setMovieList([]); //set it as emptry array
        return; //exit out of function
      }

      setMovieList(data.results || []); //set the movies state to the results from the API

      if(query && data.results.length > 0)
      {
        await updateSearchCount(query, data.results[0]);
      }


    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
    }
    finally{
      setIsLoading(false);
    }

  }

  const loadTrendingMovies = async () =>
  {
      try {
        const movies = await getTrendingMovies();
      }
      catch(error)
      {
        console.error('Failed to fetch trending movies: ${error}');
      }
  }

  useEffect(
    () => {
      fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]
  );

  useEffect(() => {
    loadTrendingMovies();
  },[]);

  return (
    <main>
      <div className = "pattern" />
        <div className="wrapper"> 
          <header>
            <img src = "./hero.png" alt = "hero banner"/>
            <h1>Find <span className = "text-gradient">Movies</span>You'll Enjoy without the Hassle</h1>

            <Search SearchTerm ={searchTerm} setSearchTerm={setSearchTerm}  />

          </header>

          {
            trendingMovies.length > 0 &&
            (
              <section className = "trending">
                <h2>Trending Movies</h2>
                <ul>
                  {trendingMovies.map((movie,index) => (
                    <li key={movie.$id}>
                       <p>{index +1}</p>
                       <img src = {movie.poster_url} alt = {movie.title}/>
                    </li>
                  ))} 
                </ul>
              </section>
            )
          }


          <section className = "all-movies">
            <h2>All movies</h2>

            {
              isLoading ? (
                <Spinner /> ) : errorMessage ? 
              (
                <p className="text-red-500">{errorMessage}</p>
              ) : (
                <ul>
                  {movieList.map((movie) => (
                    //provide unique key to each element and to prevent any unexpected behaviour
                    <MovieCard key={movie.id} movie = {movie} />
                  ))}
                </ul>
              )}
          </section>
        </div>
    </main>
    
  )
}

export default App