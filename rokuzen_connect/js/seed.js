const rokData = {
  units: [
      {
          id: "u1",
          name: "Golden Square",
          posts: [
              { id: "p1", name: "Quick 1º piso 1", type: "Quick" },
              { id: "p2", name: "Quick 1º piso 2", type: "Quick" },
              { id: "p3", name: "Quick 1º piso 3", type: "Quick" },
              { id: "p4", name: "Quick 2º piso", type: "Quick" },
              { id: "p5", name: "Reflexo 1", type: "Reflexo" },
              { id: "p6", name: "Reflexo 2", type: "Reflexo" },
              { id: "p7", name: "Sala Maca 1º piso 1", type: "Maca" },
              { id: "p8", name: "Sala Maca 1º piso 2", type: "Maca" },
              { id: "p9", name: "Sala Maca 2º piso 1", type: "Maca" },
              { id: "p10", name: "Sala Maca 2º piso 2", type: "Maca" }
          ],
          therapists: [
              { id: "t1", name: "Fernanda" },
              { id: "t2", name: "Gustavo" }
          ],
          appointments: [
              { time: "09:00", therapistId: "t1", client: "Cliente X" },
              { time: "09:30", therapistId: "t2", client: "Cliente Y" }
          ]
      },
      {
          id: "u2",
          name: "Mooca Plaza",
          posts: [
              { id: "p11", name: "Quick 1", type: "Quick" },
              { id: "p12", name: "Quick 2", type: "Quick" },
              { id: "p13", name: "Quick 3", type: "Quick" },
              { id: "p14", name: "Quick 4", type: "Quick" },
              { id: "p15", name: "Reflexo 1", type: "Reflexo" },
              { id: "p16", name: "Reflexo 2", type: "Reflexo" },
              { id: "p17", name: "Reflexo 3", type: "Reflexo" },
              { id: "p18", name: "Sala Maca 1", type: "Maca" },
              { id: "p19", name: "Sala Maca 2", type: "Maca" },
              { id: "p20", name: "Sala Maca 3", type: "Maca" }
          ],
          therapists: [
              { id: "t3", name: "Helena" },
              { id: "t4", name: "Igor" }
          ],
          appointments: [
              { time: "10:00", therapistId: "t3", client: "Cliente Z" },
              { time: "10:30", therapistId: "t4", client: "Cliente W" }
          ]
      },
      {
          id: "u3",
          name: "West Plaza",
          posts: [
              { id: "p21", name: "Quick 1", type: "Quick" },
              { id: "p22", name: "Quick 2", type: "Quick" },
              { id: "p23", name: "Quick 3", type: "Quick" },
              { id: "p24", name: "Reflexo 1", type: "Reflexo" },
              { id: "p25", name: "Reflexo 2", type: "Reflexo" },
              { id: "p26", name: "Sala Maca 1", type: "Maca" },
              { id: "p27", name: "Sala Maca 2", type: "Maca" },
              { id: "p28", name: "Sala Maca 3", type: "Maca" }
          ],
          therapists: [
              { id: "t5", name: "Juliana" },
              { id: "t6", name: "Lucas" }
          ],
          appointments: [
              { time: "11:00", therapistId: "t5", client: "Cliente A1" },
              { time: "11:30", therapistId: "t6", client: "Cliente B1" }
          ]
      },
      {
          id: "u4",
          name: "Grand Plaza",
          posts: [
              { id: "p29", name: "Quick 1", type: "Quick" },
              { id: "p30", name: "Quick 2", type: "Quick" },
              { id: "p31", name: "Quick 3", type: "Quick" },
              { id: "p32", name: "Reflexo 1", type: "Reflexo" },
              { id: "p33", name: "Reflexo 2", type: "Reflexo" },
              { id: "p34", name: "Sala Maca 1", type: "Maca" },
              { id: "p35", name: "Sala Maca 2", type: "Maca" },
              { id: "p36", name: "Sala Maca 3", type: "Maca" },
              { id: "p37", name: "Sala Maca 4", type: "Maca" }
          ],
          therapists: [
              { id: "t7", name: "Mariana" },
              { id: "t8", name: "Nicolas" }
          ],
          appointments: [
              { time: "12:00", therapistId: "t7", client: "Cliente C1" },
              { time: "12:30", therapistId: "t8", client: "Cliente D1" }
          ]
      }
  ]
};

localStorage.setItem('rok_data', JSON.stringify(rokData));