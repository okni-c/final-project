import React, { useEffect, useState, useRef } from 'react';
import { UPDATE_PRODUCTS, UPDATE_CURRENT_PRODUCT_ID } from '../../utils/actions';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { QUERY_PRODUCTS, QUERY_USER } from '../../utils/queries';
import { UPDATE_PRODUCT_REVIEW } from '../../utils/mutations';
import { useStoreContext } from "../../utils/GlobalState";
import { idbPromise } from '../../utils/helpers';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { CardActions } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';


const useStyles = makeStyles((theme) => ({
  root: {
    maxHeight: 900,
    maxWidth: 600,
  },
  clickMe: {
    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
  text: {
    minWidth: 375,
  },
  form: {
    margin: '2vw',
    width: '90%',
  },
  input: {
    width: '80%',
    fontSize: '1vw',
    margin: 'normal'
  },
  rootTwo: {
    width: '100%',
    // maxWidth: '36ch',
    backgroundColor: theme.palette.background.paper,
  },
  listItem: {
    width: '100%',
  },
  inline: {
    display: 'inline',
  },
}));

function Review() {
  const classes = useStyles();

  const [state, dispatch] = useStoreContext();

  const [reviewState, setReviewState] = useState('');

  const { id } = useParams();

  const [currentProduct, setCurrentProduct] = useState({})

  const { loading, data } = useQuery(QUERY_PRODUCTS);

  const [updateProductReview] = useMutation(UPDATE_PRODUCT_REVIEW);

  const { products } = state;

  const [reviewArr, setReviewArr] = useState();


  useEffect(() => {
    // already in global store
    if (products.length) {
      setCurrentProduct(products.find(product => product._id === id));
      dispatch({
        type: UPDATE_CURRENT_PRODUCT_ID,
        currentProduct: id
      });
      
    }
    // retrieved from server
    else if (data) {
      dispatch({
        type: UPDATE_PRODUCTS,
        products: data.products
      });

      data.products.forEach((product) => {
        idbPromise('products', 'put', product);
      });
    }
    // get cache from idb
    else if (!loading) {
      idbPromise('products', 'get').then((indexedProducts) => {
        dispatch({
          type: UPDATE_PRODUCTS,
          products: indexedProducts
        });
      })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [products, data, loading, dispatch, id, currentProduct]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setReviewState({
      ...reviewState,
      [name]: value,
    });
  };

  const name = useQuery(QUERY_USER);
  let user;
  let firstName;
  let lastName;
  let authorName;

  if (name.data) {
    user = name.data.user;
    firstName = user.firstName;
    lastName = user.lastName;
    authorName = firstName + ' ' + lastName;
    console.log(JSON.stringify(authorName));
  }


  const handleAddReview = async (event) => {
    event.preventDefault();
    try {
      const data = await updateProductReview({
        variables: {
          productID: currentProduct._id,
          reviewText: reviewState.reviewText,
          author: authorName
        }
      })
      setReviewArr(data.data.updateProductReview);
      //added reviews will update the list
      reviewList(data.data.updateProductReview);
    } catch (error) {
      console.log(error);
    };
  };

  let textInput = useRef(null);

  const reviewList = (product) => {
    // Changed condition to if the exist vs if they are undefined
    if (product.reviews) {
      // Changed foreach to map
      return product.reviews.map((review) => {
        return <>
          <ListItem className="listItem" alignItems="flex-start">
            <ListItemAvatar>
              <Avatar alt="logo" src="/favicon.ico" />
            </ListItemAvatar>
            <ListItemText
              primary={review.author}
              secondary={
                <React.Fragment>
                  <Typography
                    component="span"
                    variant="body2"
                    className={classes.inline}
                    color="textPrimary"
                  >
                  </Typography>
                  {review.reviewText}
                </React.Fragment>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
        </>
      
      })
    }
  }

  // useEffect(() => {
  //   if (handleAddReview) {
  //     reviewList(reviewArr);
  //   }
  // }, [handleAddReview, reviewList, reviewArr]);

  return (
    <>
    <div>
      <div>
            <div className={'body-container'}>
                <form noValidate autoComplete="off" className={classes.form}>
                  <TextField className={classes.input} size="normal" required name="reviewText" label="Please leave a review!" variant="outlined" multiline
                    maxRows={3} inputRef={textInput} onChange={handleChange} InputProps={{classes: { input: classes.input } }}/>
                </form>
                <CardActions>
                  <Button className={classes.clickMe} size="small" color="primary" onClick={handleAddReview}>
                    + Add Review
                  </Button>
                  <Button className={classes.clickMe} size="small" color="secondary" onClick={() => { textInput.current.value = ''; }}>
                    - Clear Review Text
                  </Button>
                </CardActions>
            </div>
      </div>
      <div>
                {currentProduct.reviews ?
            ( 
              // Changed function call because you had already passed in currentProduct.reviews here so when you called it in the foreach/map
              // you were essentially asking for product.reviews.reviews 
              // Thanks!
              <List id="review-list" className={classes.rootTwo}>{reviewList(currentProduct)}</List>
        ) : (<h2>No reviews currently. Be the first to leave some feedback on this product!</h2>)}
      </div>
      </div>
      </>
  )
};

export default Review;
