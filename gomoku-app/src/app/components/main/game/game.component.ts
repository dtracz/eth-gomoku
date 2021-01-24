import {Component, OnInit} from '@angular/core';
import {GameService} from '../../../services/game.service';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['../common.css', './game.component.css']
})
export class GameComponent implements OnInit {

  bidAmount: number;
  form: FormGroup;

  constructor(private fb: FormBuilder,
              public gameService: GameService) {
  }

  ngOnInit(): void {
    this.createForms();
  }

  private createForms(): void {
    this.form = this.fb.group({
      bidAmount: new FormControl(this.bidAmount, Validators.compose([Validators.required]))
    });
  }

  setColour(i: number, j: number): void {
    this.gameService.setColour(i, j);
  }

  sendMove(): void {
    this.gameService.sendMove();
  }

  proposeDraw(): void {
    this.gameService.proposeDraw();
  }

  sendMovesToChain(): void {
    this.gameService.sendMovesToChain();
  }

  bid(): void {
    this.gameService.bid(this.form.value.bidAmount);
  }
}
