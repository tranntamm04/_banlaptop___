import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IProductDTO } from '../../interface/IProductDTO';
import { CartService } from '../../services/cart.service';
import { AlertService } from '../../product/alert.service';
import { FormControl, FormGroup } from '@angular/forms';
import { LoginService } from '../../services/login.service';
import { Title } from '@angular/platform-browser';
import { EvaluateDTO } from '../../interface/EvaluateDTO';
import { IAccountCustomer } from '../../interface/IAccountCustomer';
import { CustomerService } from '../../services/customer.service';
import { Evaluates } from '../../interface/Evaluates';

@Component({
  selector: 'app-info-product',
  templateUrl: './info-product.component.html',
  styleUrls: ['./info-product.component.css'],
})
export class InfoProductComponent implements OnInit {
  tag = ['Asus', 'Dell', 'Apple', 'HP', 'Lenovo', 'MSI'];

  product: IProductDTO = {
    idProduct: 0,
    productName: '',
    price: 0,
    quantity: 0,
    avt: '',
    screen: '',
    hdh: '',
    cameraT: '',
    cpu: '',
    ram: '',
    rom: '',
    sdCard: '',
    pin: '',
    idType: 0,
    idPromotion: 0,
    nameType: '',
    numOfStar: 0,
    numOfReview: 0,
  };

  id!: number;
  totalItem = 0;
  name = '';
  private char = '';
  createE!: FormGroup;
  evaluate!: EvaluateDTO;
  accountCustomer!: IAccountCustomer;
  listBl: Evaluates[] = [];

  // MỚI: danh sách gợi ý
  relatedProducts: IProductDTO[] = [];

  constructor(
    private productService: ProductService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cartService: CartService,
    private alertService: AlertService,
    private loginService: LoginService,
    private titleService: Title,
    private customerService: CustomerService
  ) {this.router.routeReuseStrategy.shouldReuseRoute = () => false;
}

  ngOnInit(): void {
  this.titleService.setTitle('Chi Tiết Giỏ Hàng');
  this.name = this.loginService.getUserName();
  this.totalItem = this.cartService.getSoLuongGioHang();
  

  this.activatedRoute.paramMap.subscribe((paramMap) => {
    const newId = Number(paramMap.get('id')); 

    // Cuộn lên đầu
    if (this.id === newId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Cuộn lên trên
    this.id = newId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load chi tiết sản phẩm
    this.productService.getProductById(this.id).subscribe((data) => {
      this.product = data;

      // Gợi ý theo danh mục public
      const tag = this.product.nameType || '';
      if (tag) {
        this.productService.getByCategoryPublic(tag).subscribe((list) => {
          this.relatedProducts = (list || [])
            .filter((p) => p.idProduct !== this.product.idProduct)
            .slice(0, 8);
        });
      } else {
        this.relatedProducts = [];
      }
    });

    // Bình luận
    this.productService.getAllBinhLuan(this.id).subscribe((data) => {
      this.listBl = data;
    });
  });

  // Form đánh giá
  this.createE = new FormGroup({
    numOfStar: new FormControl(''),
    comment: new FormControl(''),
  });

  // Thông tin user
  if (this.name !== '') {
    this.customerService.getCustomerUser(this.name).subscribe((data) => {
      this.accountCustomer = data;
    });
  }
}

  
  add(p: number, productName: string, price: number, avt: string) {
    this.cartService.addToGioHang(p, productName, price, avt);
    this.alertService.showAlertSuccess('Thêm thành công sản phẩm!');
    this.totalItem = this.cartService.getSoLuongGioHang();
  }

  logout() {
    this.loginService.removeRole();
    this.loginService.removeToken();
    this.loginService.removeUserName();
    this.cartService.xoaHet();
    this.router.navigateByUrl('/login').then();
  }

  numToString(num: number) {
    return num.toLocaleString().split(',').join(this.char || '.');
  }

  createEvaluate() {
    if (this.createE.value.numOfStar < 1) {
      this.alertService.showMessageWarring('Bạn chưa đánh giá!');
      return;
    }
    if (this.createE.value.comment === '') {
      this.alertService.showMessageWarring('Bạn chưa bình luận!');
      return;
    }
    if (this.name === '') {
      this.alertService.showMessageWarring('Bạn chưa đăng nhập!');
      return;
    }
    this.evaluate = new EvaluateDTO(
      this.createE.value.numOfStar,
      this.createE.value.comment,
      this.product.idProduct,
      this.accountCustomer.idCustomer
    );
    this.productService.createEvaluate(this.evaluate).subscribe(() => {
      this.alertService.showAlertSuccess('Cảm ơn bạn đã đánh giá!');
      this.ngOnInit();
    });
  }
  
  loadProduct(id: number) {
    // Cuộn lên đầu trang cho mượt
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Gọi lại API để lấy thông tin sản phẩm mới
    this.productService.getProductById(id).subscribe((data) => {
      this.product = data;

      // Lấy danh sách sản phẩm cùng loại
      const tag = this.product.nameType || '';
      if (tag) {
        this.productService.getByCategoryPublic(tag).subscribe((list) => {
          this.relatedProducts = (list || [])
            .filter((p) => p.idProduct !== this.product.idProduct)
            .slice(0, 8);
        });
      } else {
        this.relatedProducts = [];
      }

      // Lấy lại bình luận
      this.productService.getAllBinhLuan(id).subscribe((data) => {
        this.listBl = data;
      });

      // Cập nhật ID trên URL 
      this.router.navigate(['/info-product', id], { replaceUrl: true });
    });
  }
}
