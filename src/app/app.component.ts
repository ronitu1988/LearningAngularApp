import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
// import { FooterComponent } from './Component/footer/footer.component';
import { HeaderComponent } from './Component/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, HeaderComponent], // 👈 import standalone components here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  title = 'LearningAngularApp';
  checkError() {
    var err = 10;
    
    return err;
  }
}
