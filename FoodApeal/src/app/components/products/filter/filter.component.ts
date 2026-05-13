import { Component, EventEmitter, Output, Signal, effect, input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { CategoryService } from '../../../service/category.service';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss'
})
export class FilterComponent {

  @Output() filterChanged = new EventEmitter<any>();
  initialCategories = input<string[]>([]);

  filterForm: FormGroup;
  categoriesList: Signal<Category[]>;
  private suppressEmitCount = 0;

  ngOnInit() {
    this.filterForm.valueChanges.subscribe(value => {
      if (this.suppressEmitCount > 0) {
        this.suppressEmitCount--;
        return;
      }
      this.filterChanged.emit(value);
    });
  }

  constructor(private fb: FormBuilder, private categoryService: CategoryService) {
    this.categoriesList = this.categoryService.getCategories();
    this.filterForm = this.fb.group({
      name: [''],
      description: [''],
      maxPrice: [1000],
      categories: this.fb.array([])
    });

    // When categories load or initialCategories changes, update checked state
    effect(() => {
      const cats = this.categoriesList();
      const initial = this.initialCategories();
      const arr = this.categoriesFormArray;
      // suppress all valueChanges caused by this programmatic update:
      // arr.clear() = 1 emission, each push = 1 emission
      this.suppressEmitCount = 1 + cats.length;
      arr.clear();
      cats.forEach(c => {
        const checked = initial.length === 0 || initial.includes(c.Category_name);
        if (checked) arr.push(this.fb.control(c.Category_name));
        else this.suppressEmitCount--; // skipped push, one less emission
      });
    });
  }

  get categoriesFormArray() {
    return this.filterForm.get('categories') as FormArray;
  }

  onCategoryChange(event: any) {
    if (event.target.checked) {
      this.categoriesFormArray.push(this.fb.control(event.target.value));
    } else {
      const index = this.categoriesFormArray.controls
        .findIndex((x: any) => x.value === event.target.value);
      this.categoriesFormArray.removeAt(index);
    }
  }

  apply() {
    this.filterChanged.emit(this.filterForm.value);
  }

  isCategorySelected(name: string): boolean {
    return this.categoriesFormArray.controls.some(c => c.value === name);
  }

  clear() {
    const totalChanges = 1 + 1 + this.categoriesList().length; // reset + arr.clear() + N pushes
    this.suppressEmitCount = totalChanges;
    this.filterForm.reset({
      name: '',
      description: '',
      maxPrice: 1000,
    });
    // Re-check all categories
    const arr = this.categoriesFormArray;
    arr.clear();
    this.categoriesList().forEach(c => arr.push(this.fb.control(c.Category_name)));
    this.filterForm.get('maxPrice')?.setValue(1000, { emitEvent: false });
    this.suppressEmitCount = 0; // drain any remaining, then emit manually
    this.filterChanged.emit(this.filterForm.value);
  }





}



