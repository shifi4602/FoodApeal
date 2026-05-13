import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { addOrEdit } from '../../models/addOrEditEnum.model';
import { Product } from '../../models/products.model';
import { InputNumberModule } from 'primeng/inputnumber';
import { ProductsService } from '../../service/products.service';
import { CategoryService } from '../../service/category.service';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, InputTextModule, ReactiveFormsModule, InputNumberModule, DropdownModule, FileUploadModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit, OnChanges {

  @Input() addOrEditVal: addOrEdit = addOrEdit.add;
  @Input() productToEdit?: Product;
  @Output() saved = new EventEmitter<void>();
  myForm: FormGroup;
  categories: { label: string; value: number }[] = [];
  imagePreview: string | null = null;

  constructor(private fb: FormBuilder, private productsService: ProductsService, private categoryService: CategoryService) {
    this.myForm = this.fb.group({
      productName: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: [null, [Validators.required]],
      description: ['', [Validators.required]],
      imgUrl: ['', [Validators.required]],
    });
  }
  
  ngOnInit(): void {
    this.addOrEditValue();
    // Load categories from backend
    const cats = this.categoryService.getCategories()();
    if (cats.length > 0) {
      this.categories = cats.map(c => ({ label: c.Category_name, value: c.Category_Id }));
    } else {
      // Subscribe-like: re-check after a short delay in case still loading
      const interval = setInterval(() => {
        const loaded = this.categoryService.getCategories()();
        if (loaded.length > 0) {
          this.categories = loaded.map(c => ({ label: c.Category_name, value: c.Category_Id }));
          clearInterval(interval);
        }
      }, 200);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productToEdit'] && this.productToEdit) {
      this.populateForm();
    }
  }

  onSubmit() {
    if (this.myForm.valid) {
      if (this.addOrEditVal === addOrEdit.add) {
        this.addProduct();
      } else {
        this.updateProduct();
      }
    }
  }

  addOrEditMessageSignal = signal<string>("");

  resetForm() {
    this.myForm.reset();
    this.imagePreview = null;
  }

  clearImage() {
    this.imagePreview = null;
    this.myForm.patchValue({ imgUrl: '' });
    this.myForm.get('imgUrl')?.markAsTouched();
  }

  addOrEditValue() {
    if (this.addOrEditVal == addOrEdit.add) {
      this.addOrEditMessageSignal.set("הוסף מוצר");
    }
    if (this.addOrEditVal == addOrEdit.edit) {
      this.addOrEditMessageSignal.set("ערוך מוצר");
    }
  }

  populateForm() {
    if (this.productToEdit) {
      this.myForm.patchValue({
        productName: this.productToEdit.Product_name,
        price: this.productToEdit.price,
        categoryId: this.productToEdit.category_Id,
        description: this.productToEdit.description,
        imgUrl: this.productToEdit.imageUrl
      });
      this.imagePreview = this.productToEdit.imageUrl ?? null;
    }
  }

  onFileSelect(event: any) {
    const file: File = event.files?.[0] ?? event.currentFiles?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
        this.myForm.patchValue({ imgUrl: this.imagePreview });
        this.myForm.get('imgUrl')?.markAsTouched();
      };
      reader.readAsDataURL(file);
    }
  }

  updateProduct() {
    if (this.productToEdit) {
      const selCatId: number = this.myForm.get('categoryId')?.value;
      const selCat = this.categories.find(c => c.value === selCatId);
      const updatedProduct: Product = {
        ...this.productToEdit,
        Product_name: this.myForm.get('productName')?.value,
        price: this.myForm.get('price')?.value,
        category_Id: selCatId,
        description: this.myForm.get('description')?.value,
        imageUrl: this.myForm.get('imgUrl')?.value,
        category_name: selCat?.label ?? '',
        isAvailable: true
      };

      this.productsService.updateProduct(updatedProduct).subscribe({
        next: () => {
          this.myForm.reset();
          this.saved.emit();
          alert('המוצר עודכן בהצלחה!');
        },
        error: (err) => {
          console.error('Update failed:', err);
          alert('עדכון המוצר נכשל.');
        }
      });
    }
  }

  addProduct() {
    const newProduct: Product = new Product();
    newProduct.Products_id = 0;
    newProduct.Product_name = this.myForm.get('productName')?.value;
    newProduct.price = this.myForm.get('price')?.value;
    newProduct.category_Id = this.myForm.get('categoryId')?.value;
    newProduct.description = this.myForm.get('description')?.value;
    newProduct.imageUrl = this.myForm.get('imgUrl')?.value;
    const addCat = this.categories.find(c => c.value === newProduct.category_Id);
    newProduct.category_name = addCat?.label ?? '';
    newProduct.isAvailable = true;

    this.productsService.addProduct(newProduct).subscribe({
      next: () => {
        this.myForm.reset();
        this.saved.emit();
        alert('המוצר נוסף בהצלחה!');
      },
      error: (err) => {
        console.error('Add product failed:', err);
        alert('הוספת המוצר נכשלה.');
      }
    });
  }
}
