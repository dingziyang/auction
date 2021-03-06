import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Comment, Product, ProductService} from '../shared/product.service';
import {WebSocketService} from '../shared/web-socket.service';
import 'rxjs/add/operator/find';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {

  product: Product;

  comments: Comment [];

  newRating = 5; // 可变评论，默认5星
  newComment = '';

  isCommentHidden = true; // “增加评论” 是否显示

  isWatched = false; // 当前是否关注此商品了

  currentBid: number;  // 当前出价

  subscription: Subscription;

  constructor(private routeInfo: ActivatedRoute,
              private productService: ProductService,
              private wsService: WebSocketService) {
  }

  ngOnInit() {
    const productId: number = this.routeInfo.snapshot.params['productId'];
    this.productService.getProduct(productId).subscribe(
      product => {
        this.product = product;
        this.currentBid = product.price;
      }
    );
    this.productService.getCommentsForProductId(productId).subscribe(
      comments => this.comments = comments
    );
  }

  addComment() {
    const commentObj = new Comment(0, this.product.id, new Date().toISOString(), '某人', this.newRating, this.newComment);
    this.comments.unshift(commentObj);

    // reduce(回调函数，初始值),即 0 + 每个item
    const sumRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
    this.product.rating = sumRating / this.comments.length;

    this.newComment = null;
    this.newRating = 5;
    this.isCommentHidden = true;
  }

  watchProduct() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.isWatched = false;
      this.subscription = null;
    } else {
      this.isWatched = true;
      this.subscription = this.wsService.createObservableSocket('ws://localhost:8085', this.product.id)
        .subscribe(
          products => {
            let a = products;
            let product = products.find(p => p.productId === this.product.id);
            this.currentBid = product.bid;
          }
        );
    }
  }

}
